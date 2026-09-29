// push-contacto: cuando se crea o edita un cliente en MejoraCRM, empuja esos
// datos hacia contactos_finales (proyecto Supabase de MejoraContactos) para
// que sea la fuente de verdad de identidad de contactos en todo el
// ecosistema. Ver INFORME-SINCRONIZACION-CONTACTOS.md (raíz de este repo)
// para el diseño completo.
//
// Llamada desde el frontend autenticado (src/hooks/useClients.ts, después
// de un insert/update exitoso) vía:
//   supabase.functions.invoke('push-contacto', { body: { client_id } })
//
// Requiere JWT de usuario válido (default de Supabase, ver
// supabase/config.toml) -- no hace falta verificar auth acá adentro, el
// gateway de Edge Functions ya lo hizo antes de invocar esta función.
//
// Best-effort por diseño: si contactos-api no está configurada o falla, se
// loguea en contactos_sync_log y se responde con error, pero el caller
// (useClients.ts) nunca debe dejar que esto rompa la experiencia de crear/
// editar un cliente -- ver el try/catch del lado del frontend.
//
// Variables de entorno que necesita esta función (Supabase → Project
// Settings → Edge Functions → Secrets, NUNCA en el repo):
//   CONTACTOS_API_URL  -- URL de la función contactos-api de MejoraContactos
//                         (ej. https://<ref>.supabase.co/functions/v1/contactos-api)
//   CONTACTOS_API_KEY  -- token de escritura para MejoraCRM, generado según
//                         el README de contactos-api (puede_escribir=true)

interface ClientRow {
  id: string;
  name: string;
  contact_name: string | null;
  company: string | null;
  whatsapp: string | null;
  email: string | null;
  address: string | null;
  location: string | null;
  province: string | null;
  country: string;
  notes: string | null;
  persona_id: string | null;
}

function corsHeaders(): Record<string, string> {
  return {
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

function jsonResponse(body: unknown, status: number, cors: Record<string, string>): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
}

// contactos_finales separa nombre/apellido; MejoraCRM no lo hace (name es
// razón social o nombre completo, contact_name es la persona de contacto si
// se cargó). Partir por el primer espacio es una aproximación a propósito
// simple -- queda documentado como limitación conocida en el informe, no es
// un parser de nombres real.
function partirNombre(nombreCompleto: string): { nombre: string; apellido: string } {
  const limpio = nombreCompleto.trim();
  const espacio = limpio.indexOf(" ");
  if (espacio === -1) return { nombre: limpio, apellido: "" };
  return { nombre: limpio.slice(0, espacio), apellido: limpio.slice(espacio + 1) };
}

function mapearContacto(client: ClientRow): Record<string, unknown> {
  const fuenteNombre = client.contact_name?.trim() || client.name;
  const { nombre, apellido } = partirNombre(fuenteNombre);

  return {
    nombre,
    apellido,
    organizacion: client.company || "",
    whatsapp: client.whatsapp ? [client.whatsapp] : [],
    emails: client.email ? [client.email] : [],
    domicilio: client.address || client.location || "",
    provincia: client.province || "",
    pais: client.country || "",
    nota_referencia: client.notes || "",
  };
}

Deno.serve(async (req: Request) => {
  const cors = corsHeaders();
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405, cors);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const contactosApiUrl = Deno.env.get("CONTACTOS_API_URL");
  const contactosApiKey = Deno.env.get("CONTACTOS_API_KEY");

  if (!supabaseUrl || !serviceKey) {
    console.error("[push-contacto] faltan SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY");
    return jsonResponse({ error: "Server misconfiguration" }, 500, cors);
  }
  if (!contactosApiUrl || !contactosApiKey) {
    // No configurado todavía (caso normal hasta que se dé de alta la key de
    // MejoraCRM en contactos-api) -- no es un error del cliente, es un 501
    // explícito para que el caller sepa que esto está apagado a propósito.
    console.log("[push-contacto] CONTACTOS_API_URL/CONTACTOS_API_KEY no configurados -- sync desactivada");
    return jsonResponse({ sincronizado: false, motivo: "contactos-api no configurada" }, 501, cors);
  }

  let clientId: string;
  try {
    const body = await req.json();
    clientId = body.client_id;
    if (!clientId) throw new Error("falta client_id");
  } catch {
    return jsonResponse({ error: "Body inválido, se esperaba { client_id }" }, 400, cors);
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
      body: JSON.stringify({ direccion: "push", cantidad, exito, error: error ?? null }),
    }).catch((e) => console.error("[push-contacto] no se pudo escribir contactos_sync_log:", e));
  };

  try {
    const resCliente = await fetch(
      `${supabaseUrl}/rest/v1/clients?id=eq.${clientId}&select=id,name,contact_name,company,whatsapp,email,address,location,province,country,notes,persona_id`,
      { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` } },
    );
    if (!resCliente.ok) throw new Error(`no se pudo leer el cliente (HTTP ${resCliente.status})`);
    const clientes: ClientRow[] = await resCliente.json();
    const client = clientes[0];
    if (!client) {
      registrar(false, 0, `client_id no encontrado: ${clientId}`);
      return jsonResponse({ error: "Cliente no encontrado" }, 404, cors);
    }

    const payload: Record<string, unknown> = mapearContacto(client);
    if (client.persona_id) payload.persona_id = client.persona_id;

    const resContactos = await fetch(contactosApiUrl, {
      method: "POST",
      headers: { "X-Api-Key": contactosApiKey, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!resContactos.ok) {
      const texto = await resContactos.text();
      throw new Error(`contactos-api respondió HTTP ${resContactos.status}: ${texto.slice(0, 300)}`);
    }
    const resultado = await resContactos.json();
    const personaId = resultado.persona_id as string;

    const resUpdate = await fetch(`${supabaseUrl}/rest/v1/clients?id=eq.${clientId}`, {
      method: "PATCH",
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({ persona_id: personaId, contactos_synced_at: new Date().toISOString() }),
    });
    if (!resUpdate.ok) throw new Error(`no se pudo guardar persona_id en clients (HTTP ${resUpdate.status})`);

    console.log(`[push-contacto] cliente ${clientId} -> persona_id ${personaId} (creado=${resultado.creado})`);
    registrar(true, 1);
    return jsonResponse({ persona_id: personaId, creado: !!resultado.creado }, 200, cors);
  } catch (err) {
    const mensaje = err instanceof Error ? err.message : String(err);
    console.error("[push-contacto] error:", mensaje);
    registrar(false, 0, mensaje);
    return jsonResponse({ error: "No se pudo sincronizar el contacto", detalle: mensaje }, 502, cors);
  }
});
