// pull-contactos: trae de contactos_finales (proyecto Supabase de
// MejoraContactos) los contactos nuevos o modificados desde la última
// corrida, y los upsertea en clients -- matcheando por persona_id. Ver
// INFORME-SINCRONIZACION-CONTACTOS.md (raíz de este repo).
//
// Llamada por el workflow programado .github/workflows/sync-contactos.yml
// (cron cada 15 minutos + disparo manual), NO por un usuario logueado --
// por eso NO usa el JWT de un usuario. En cambio: se llama con la anon key
// pública como Bearer (así pasa la verificación de JWT que Supabase exige
// por default en toda Edge Function, sin tener que desactivarla) MÁS un
// secreto propio en el header X-Cron-Secret, chequeado acá adentro. Doble
// capa en vez de sacar una -- decisión deliberada, ver el informe.
//
// Variables de entorno que necesita esta función (Supabase → Project
// Settings → Edge Functions → Secrets, NUNCA en el repo):
//   CONTACTOS_API_URL   -- misma que usa push-contacto
//   CONTACTOS_API_KEY   -- misma que usa push-contacto (una sola key de
//                          MejoraCRM sirve para leer y escribir, ver README
//                          de contactos-api)
//   CRON_SECRET         -- secreto random propio de esta función, generado
//                          igual que cualquier API key (ver contactos-api),
//                          NO es la misma que CONTACTOS_API_KEY -- esa la
//                          valida MejoraContactos, esta la valida MejoraCRM.
//
// SOLO actualiza los campos "compartidos" (datos de contacto) en clients ya
// existentes -- nunca toca status/assigned_to/segment/channel/
// first_contact_date/organization_id, que son dueños exclusivos de
// MejoraCRM. Un contacto nuevo (persona_id no visto antes) se crea con
// status='potencial' y sin assigned_to (alguien lo tiene que asignar a
// mano).

interface ContactoExterno {
  persona_id: string;
  nombre: string;
  apellido: string;
  organizacion: string;
  whatsapp: string[];
  emails: string[];
  domicilio: string;
  provincia: string;
  pais: string;
  nota_referencia: string;
  updated_at: string | null;
}

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

function nombreCompleto(c: ContactoExterno): string {
  return [c.nombre, c.apellido].filter(Boolean).join(" ").trim() || c.organizacion || "(sin nombre)";
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST" && req.method !== "GET") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const contactosApiUrl = Deno.env.get("CONTACTOS_API_URL");
  const contactosApiKey = Deno.env.get("CONTACTOS_API_KEY");
  const cronSecret = Deno.env.get("CRON_SECRET");

  if (!supabaseUrl || !serviceKey) {
    console.error("[pull-contactos] faltan SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY");
    return jsonResponse({ error: "Server misconfiguration" }, 500);
  }
  if (!cronSecret || req.headers.get("X-Cron-Secret") !== cronSecret) {
    return jsonResponse({ error: "X-Cron-Secret inválido o ausente" }, 401);
  }
  if (!contactosApiUrl || !contactosApiKey) {
    console.log("[pull-contactos] CONTACTOS_API_URL/CONTACTOS_API_KEY no configurados -- sync desactivada");
    return jsonResponse({ sincronizado: false, motivo: "contactos-api no configurada" }, 501);
  }

  const registrar = (exito: boolean, cantidad: number, error?: string) => {
    fetch(`${supabaseUrl}/rest/v1/contactos_sync_log`, {
      method: "POST",
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({ direccion: "pull", cantidad, exito, error: error ?? null }),
    }).catch((e) => console.error("[pull-contactos] no se pudo escribir contactos_sync_log:", e));
  };

  try {
    // "Desde cuándo" = la última vez que esta función corrió con éxito,
    // según el propio log. Primera corrida (log vacío) trae todo.
    const resUltimaCorrida = await fetch(
      `${supabaseUrl}/rest/v1/contactos_sync_log?direccion=eq.pull&exito=eq.true&select=creado_en&order=creado_en.desc&limit=1`,
      { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` } },
    );
    const ultimaCorrida = resUltimaCorrida.ok ? await resUltimaCorrida.json() : [];
    const desde: string | null = ultimaCorrida[0]?.creado_en ?? null;

    let url = `${contactosApiUrl}?tamano=2000`;
    if (desde) url += `&desde=${encodeURIComponent(desde)}`;

    const resContactos = await fetch(url, { headers: { "X-Api-Key": contactosApiKey } });
    if (!resContactos.ok) {
      throw new Error(`contactos-api respondió HTTP ${resContactos.status}: ${(await resContactos.text()).slice(0, 300)}`);
    }
    const { contactos } = (await resContactos.json()) as { contactos: ContactoExterno[] };

    let creados = 0;
    let actualizados = 0;
    const ahora = new Date().toISOString();

    for (const contacto of contactos) {
      const resExistente = await fetch(
        `${supabaseUrl}/rest/v1/clients?persona_id=eq.${contacto.persona_id}&select=id`,
        { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` } },
      );
      const existentes = resExistente.ok ? await resExistente.json() : [];

      const camposCompartidos = {
        name: nombreCompleto(contacto),
        company: contacto.organizacion || null,
        whatsapp: contacto.whatsapp[0] || null,
        email: contacto.emails[0] || null,
        address: contacto.domicilio || null,
        province: contacto.provincia || null,
        country: contacto.pais || "Argentina",
        notes: contacto.nota_referencia || null,
        contactos_synced_at: ahora,
      };

      if (existentes.length > 0) {
        // Update: SOLO los campos compartidos de arriba -- status/
        // assigned_to/segment/channel/organization_id no se tocan.
        const res = await fetch(`${supabaseUrl}/rest/v1/clients?id=eq.${existentes[0].id}`, {
          method: "PATCH",
          headers: {
            apikey: serviceKey,
            Authorization: `Bearer ${serviceKey}`,
            "Content-Type": "application/json",
            Prefer: "return=minimal",
          },
          body: JSON.stringify(camposCompartidos),
        });
        if (res.ok) actualizados++;
        else console.error(`[pull-contactos] no se pudo actualizar cliente de persona_id ${contacto.persona_id}: HTTP ${res.status}`);
      } else {
        const res = await fetch(`${supabaseUrl}/rest/v1/clients`, {
          method: "POST",
          headers: {
            apikey: serviceKey,
            Authorization: `Bearer ${serviceKey}`,
            "Content-Type": "application/json",
            Prefer: "return=minimal",
          },
          body: JSON.stringify({
            ...camposCompartidos,
            persona_id: contacto.persona_id,
            origen: "motor-contactos",
            status: "potencial",
          }),
        });
        if (res.ok) creados++;
        else console.error(`[pull-contactos] no se pudo crear cliente para persona_id ${contacto.persona_id}: HTTP ${res.status}`);
      }
    }

    console.log(`[pull-contactos] ${contactos.length} contactos procesados: ${creados} creados, ${actualizados} actualizados`);
    registrar(true, contactos.length);
    return jsonResponse({ procesados: contactos.length, creados, actualizados, desde }, 200);
  } catch (err) {
    const mensaje = err instanceof Error ? err.message : String(err);
    console.error("[pull-contactos] error:", mensaje);
    registrar(false, 0, mensaje);
    return jsonResponse({ error: "Fallo la sincronización", detalle: mensaje }, 502);
  }
});
