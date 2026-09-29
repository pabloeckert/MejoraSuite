# Migración de contactos — diagnóstico de MejoraCRM

**Fecha:** 2026-09-15 · **Alcance:** solo diagnóstico y documentación. No se modificó ningún esquema, tabla, tipo ni código — ni acá ni en MejoraContactos. Archivo sin commitear a propósito.

**Método:** clon completo del repo (público en GitHub, sin necesitar login) y lectura directa de las 14 migraciones SQL, los tipos generados de Supabase, y el código fuente relevante (hooks, páginas, componentes de clientes/interacciones). No pude conectarme a la base de datos real (no tengo credenciales) — donde algo depende de eso, lo digo explícitamente en vez de asumir.

---

## ⚠️ Antes de lo que preguntaste: un hallazgo de seguridad pendiente, sin resolver

No es parte de esta migración, pero lo encontré revisando la documentación del propio repo (`mejorasuite/ESPECIFICACION.md`, `mejorasuite/PENDIENTES.md` — notas de una sesión anterior, 2026-08-15) y me parece más importante que cualquier otra cosa de este documento:

> "MejoraCRM: `.env` real y `run-migration.mjs` con `service_role` key + contraseñas en texto plano estaban commiteados — **corregido**... **Pendiente que Pablo rote la key en Supabase Dashboard** y cambie esas contraseñas — Claude no puede hacerlo."

Y en la lista de bloqueados de esa misma sesión: **"Rotar `service_role` key de Supabase de MejoraCRM — pendiente desde el hallazgo de seguridad"**, sin tachar.

Verifiqué el estado actual: `run-migration.mjs` ya no existe en el árbol de archivos de hoy, y `.env` está correctamente en `.gitignore`. Pero **"corregido" acá significó sacarlo del código actual, no necesariamente limpiar el historial de git** — no intenté confirmar si la key sigue siendo recuperable desde commits viejos (mi propia herramienta bloqueó el intento de inspeccionar ese historial, correctamente, porque hubiera significado materializar un secreto real en el chat). Dado que este es un repo público, si esa key de service role sigue en el historial y nunca se rotó, **cualquiera puede tener acceso total de lectura/escritura a tu base de producción sin pasar por RLS**.

**Esto no depende de nada de lo que sigue en este documento — te recomiendo resolverlo ahora, antes de conectar MejoraCRM a nada más:**
1. Supabase Dashboard → tu proyecto → Project Settings → API → rotar la `service_role` key (invalida la vieja al instante).
2. Cambiar cualquier contraseña que haya quedado en texto plano en ese `run-migration.mjs` viejo.
3. Si te importa que la key vieja ni siquiera quede visible en el historial de git (recomendable, dado que el repo es público), usar `git filter-repo` o BFG Repo-Cleaner para purgarla — puedo ayudarte con eso si querés, aparte de esta migración.

---

## 1. Cómo maneja MejoraCRM sus contactos hoy

**Tiene su propia base de datos** (Postgres vía Supabase, proyecto propio — ver §6), no hay storage local tipo IndexedDB como en la app web de MejoraContactos. El equivalente a "contacto" acá se llama **`clients`**.

### Esquema actual completo de `clients` (reconstruido de las migraciones + confirmado contra `src/integrations/supabase/types.ts`)

```sql
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  company TEXT,
  contact_name TEXT,
  segment TEXT,
  location TEXT,
  whatsapp TEXT,
  email TEXT,
  channel TEXT,
  first_contact_date DATE DEFAULT CURRENT_DATE,
  status client_status NOT NULL DEFAULT 'potencial',  -- enum: 'activo' | 'potencial' | 'inactivo'
  notes TEXT,
  assigned_to UUID REFERENCES auth.users(id),
  address TEXT,
  province TEXT,
  country TEXT NOT NULL DEFAULT 'Argentina',
  organization_id UUID REFERENCES organizations(id),   -- ver nota de multitenancy abajo
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

Evolucionó en 4 pasos documentados: creación inicial (2026-04-14, `status` con valores `lead/cliente/inactivo`) → reescritura "v2" (2026-04-22, `status` pasa a `activo/potencial/inactivo`, se agregan `address`/`province`) → se agrega `country` (2026-05-02) → se agrega `organization_id` (2026-06-12, multitenancy).

En el código, el tipo TypeScript **no se escribe a mano** — es un alias directo del tipo generado por Supabase: `export type Client = Tables<"clients">` (`src/lib/types.ts:13`). Una sola fuente de verdad para el tipo, buena práctica.

**Hallazgo aparte:** el archivo de tipos generado (`src/integrations/supabase/types.ts`) **no incluye `organization_id`** en el `Row` de `clients` — quedó desactualizado desde la migración de multitenancy (2026-06-12) y nunca se regeneró (`supabase gen types typescript`). No rompe nada en tiempo de ejecución (el trigger de Postgres asigna `organization_id` solo, sin que el frontend lo mande), pero significa que TypeScript no te va a avisar si en algún punto el código necesita leer o filtrar por `organization_id` explícitamente.

### Multitenancy — esto cambia el planteo de la migración

MejoraCRM **no es un CRM de un solo negocio** — es un producto SaaS multi-tenant: cada cuenta nueva que se registra crea su propia fila en `organizations`, y `clients`/`products`/`interactions` quedan scoped por `organization_id` vía RLS (`current_org_id()`, trigger `set_organization_id()` en cada insert). Está desplegado en producción (`crm.mejoraok.com`) y el propio repo lo llama "producto comercial" (`COMMERCIAL_ROADMAP.md`).

**Por qué importa para esta migración:** "MejoraContactos como fuente de verdad de MejoraCRM" solo tiene sentido para la organización que sos vos/Mejora Continua usando el CRM — no para cualquier otra empresa que se registre a usar MejoraCRM como SaaS. Si en algún momento hay otro tenant real (no vos), sus `clients` no tienen ninguna relación con tu `motor-contactos`. Esto no bloquea nada, pero sí significa que la sincronización futura debería ser **"traer contactos de `contactos_finales` hacia la organización de Mejora Continua específicamente"**, no un mapeo genérico 1:1 de toda la tabla `clients`.

### Tablas relacionadas (para contexto, no son "contacto" en sí)
- **`interactions`** — reemplazó por completo a una tabla `opportunities` que existió y se borró en la migración v2. Es mucho más rica que un simple "estado de oportunidad": cada interacción registra medio, resultado, si es presupuesto/venta (con línea de productos vía `interaction_lines`), estado de negociación, motivo de seguimiento, motivo de pérdida, etc. Ver §3.
- **`products`** — catálogo (nombre, categoría, precio, moneda, unidad).
- **`profiles`/`user_roles`** — equipo de ventas (`admin`/`supervisor`/`vendedor`), con `monthly_target` agregado después.
- **`organizations`** — el tenant.

---

## 2. ¿Hay datos reales cargados hoy, o son de prueba?

**No puedo confirmarlo con certeza consultando la base en vivo (no tengo credenciales) — pero encontré evidencia documental fuerte y reciente que apunta a que, salvo que lo hayas hecho vos mismo desde entonces, todavía hay datos reales en producción.**

Lo que encontré, textual, de una sesión del 2026-08-21 (`mejorasuite/PENDIENTES.md`, "Fase 8 — Borrado de datos reales"):

> "Pablo pidió (a) borrar todos los datos reales de las 3 herramientas... Confirmado con Pablo antes de borrar nada real: sí, vaciar la producción real de MejoraCRM; sí, borrar los 45 contactos y campañas reales de MejoraWS."

Se ejecutó para MejoraWS (backup + vaciado, confirmado). **Para MejoraCRM quedó explícitamente sin hacer**, marcado `[ ]` sin tachar:

> "**MejoraCRM — base de producción real (Supabase) sigue sin vaciar.** No hay credenciales reales en este entorno... Pablo tiene que correr esto a mano en el SQL Editor de Supabase:
> ```sql
> truncate table interaction_lines cascade;
> truncate table interactions cascade;
> truncate table clients cascade;
> truncate table products cascade;
> ```"

Y quedó otra vez en la lista de "Bloqueado / requiere a Pablo" de esa misma sesión, sin tachar.

**Conclusión:** salvo que hayas corrido ese SQL vos mismo en algún momento entre el 21 de agosto y hoy, `clients` en producción probablemente todavía tiene datos reales de clientes (no sé cuántos ni desde cuándo). Lo que sí cambió en esa misma sesión: `DEMO_MODE` pasó de ser una constante fija a un **toggle en tiempo real** (`src/lib/demoMode.ts`, `localStorage` + `useSyncExternalStore`), activo por default — así que quien abre la app hoy ve datos ficticios (`src/demo/demoData.ts`) a menos que apague el toggle, momento en el que se conecta a la base real (la que, según lo de arriba, probablemente sigue teniendo lo que había).

**Te recomiendo confirmar esto directo en el Dashboard de Supabase** (`SELECT count(*) FROM clients;`) antes de decidir cualquier estrategia de migración — la respuesta cambia bastante si son 0 o si son varias decenas de clientes reales con historial de interacciones.

---

## 3. Campos específicos de CRM (que un contacto genérico no tendría)

**En `clients`:**
- `status` (`activo` / `potencial` / `inactivo`) — lo más parecido a un estado de ciclo de vida a nivel cliente.
- `assigned_to` — vendedor asignado (referencia a `auth.users`).
- `segment` — segmento/categoría comercial.
- `channel` — canal de adquisición.
- `first_contact_date` — fecha de primer contacto.
- `organization_id` — a qué cuenta/tenant pertenece (ver multitenancy arriba).

**No hay un campo de "etapa del funnel" en `clients` en sí** — eso vive a nivel de cada interacción, no del cliente:

**En `interactions`** (esto es lo que reemplazó al concepto de "oportunidad"):
- `medium`: whatsapp, llamada, email, reunión presencial, reunión virtual, DM Instagram/Facebook/LinkedIn, visita a campo.
- `result`: presupuesto, venta, seguimiento, sin respuesta, no interesado — **esto es lo que arma las columnas del Kanban de pipeline** (`PipelineKanban.tsx`), no un campo de "stage" separado.
- `quote_path` (catálogo/adjunto), `total_amount`, `currency`, `attachment_url`.
- `reference_quote_id` — referencia a OTRA interacción (para encadenar un seguimiento a su presupuesto original).
- `negotiation_state`: con interés / sin respuesta / revisando / pidió cambios.
- `followup_scenario`: vinculado / independiente / histórico. `followup_motive`.
- `historic_quote_amount` / `historic_quote_date` — para cargar una venta histórica sin un presupuesto formal previo en el sistema.
- `loss_reason`, `estimated_loss` — motivo y monto estimado de una venta perdida.
- `next_step`, `follow_up_date`, `notes`.
- **`interaction_lines`** (tabla aparte): `product_id`, `quantity`, `unit_price`, `line_total` — el detalle de productos de un presupuesto/venta.

**En `profiles`/`user_roles`:** `role` (admin/supervisor/vendedor), `monthly_target` (cuota mensual, agregada 2026-06-10).

Todo esto es exactamente el tipo de campo que identificamos como "hueco" en `contactos_finales` durante el diagnóstico de MejoraContactos — acá ya existe y está bastante más desarrollado de lo que anticipé (no es solo "estado de funnel" y "vendedor asignado", hay todo un modelo de presupuestos/ventas/seguimientos con productos).

---

## 4. Cómo se referencia un contacto hoy

**Por `id`** — el UUID nativo de Postgres (`gen_random_uuid()`), en todo el código: `useDeactivateClient` filtra `.eq("id", id)`, `useClientsMinimal` expone `{id, name}`, `interactions.client_id` es FK directa a `clients.id`. No encontré ningún lugar donde el código use email o whatsapp como clave de identidad — esos campos son datos de contacto, no identificadores.

**Esto es una buena noticia para lo que sigue:** el código ya está construido alrededor de un ID estable de tipo UUID, exactamente la forma de `persona_id`. Migrar no significa enseñarle al código un concepto nuevo de identidad — significa decidir de dónde sale ese UUID (¿lo sigue generando Postgres como hoy, o pasa a ser el `persona_id` que ya trae el contacto desde MejoraContactos?).

**El único punto flojo encontrado:** la detección de duplicados al importar un CSV a mano (`ClientImportDialog.tsx` + `Clients.tsx`) es un match de texto plano, case-insensitive, por `name` **o** `whatsapp` exacto (sin normalizar a E.164 como hace motor-contactos) — mucho más ingenuo que el motor de dedup de MejoraContactos. Es una función de importación manual aparte, no una relación en la base.

---

## 5. Mapa de dónde se lee/escribe esta información

No es exhaustivo línea por línea, pero cubre todos los puntos de entrada reales:

| Archivo | Qué hace con `clients` |
|---|---|
| `src/hooks/useClients.ts` | Toda la lectura/escritura real: `useClientsInfinite` (paginado, 50 por página), `useAllClients`, `useClientsMinimal` (`{id,name}` para selects), `useDeactivateClient` (`UPDATE status='inactivo'`), `addDemoClient` (solo en memoria, modo demo). |
| `src/pages/Clients.tsx` | Página principal: alta manual (`ClientFormDialog`), edición, **importación CSV** (parseo + detección de duplicados por nombre/whatsapp, `INSERT` en lote de los no-duplicados). |
| `src/components/clients/ClientsTable.tsx` | Tabla/listado. |
| `src/components/clients/ClientDetailDialog.tsx` | Vista de detalle de un cliente (probablemente incluye su historial de `interactions`). |
| `src/components/clients/ClientFormDialog.tsx` | Formulario de alta/edición manual. |
| `src/components/clients/ClientImportDialog.tsx` | Preview de importación CSV antes de confirmar. |
| `src/components/interactions/steps/StepCliente.tsx` + `InteractionForm.tsx` | Selección de cliente al cargar una interacción nueva (wizard de 4 pasos). |
| `src/components/interactions/PipelineKanban.tsx` | Tablero de pipeline — agrupa `interactions` por `result`, no lee `clients.status` directo para las columnas. |
| `src/hooks/useDashboard.ts`, `src/components/dashboard/OwnerViewV2.tsx` | KPIs del dashboard (probablemente contra las vistas materializadas, ver `20260423133000_add_materialized_views.sql`, que sí hace `FROM public.clients`). |
| `src/lib/excelExport.ts` | Exportación a Excel — mismo patrón que MejoraContactos, pero en sentido inverso (CRM → Excel, no Excel → CRM). |
| `src/lib/businessLogic.ts` | Lógica de negocio compartida — no encontré ahí un concepto explícito de "funnel"/"pipeline", eso vive en `PipelineKanban.tsx` y `Reports.tsx`. |
| `src/hooks/useNotifications.ts` | Notificaciones (probablemente recordatorios de `follow_up_date`). |
| `src/demo/demoData.ts` | Datos ficticios para el modo demo — no toca la base real nunca. |

---

## 6. ¿Tiene su propio proyecto de Supabase?

**Sí, propio** — no comparte proyecto con MejoraContactos ni con ningún otro repo del ecosistema. Confirmado por: `supabase/migrations/` con 14 archivos propios, `src/integrations/supabase/client.ts` apuntando a sus propias env vars (`VITE_SUPABASE_URL`/`VITE_SUPABASE_PUBLISHABLE_KEY` en `.env`), y el hallazgo de seguridad de arriba (una `service_role` key propia, distinta de la de MejoraContactos). Esto significa que conectar MejoraCRM a `contactos_finales` (que vive en el proyecto Supabase de MejoraContactos) es necesariamente una integración **entre dos proyectos Supabase distintos** — exactamente el escenario para el que se armó la Edge Function `contactos-api` con autenticación por API key, no un acceso directo a tabla entre bases.

---

## Evaluación: qué tan invasivo sería adoptar `persona_id`

Menos de lo que esperaba, con una salvedad grande:

**A favor:**
- El código ya identifica clientes por un UUID estable en todos lados — no hay que enseñarle un concepto de identidad nuevo, "solo" hay que decidir el origen de ese UUID.
- El tipo `Client` es un alias directo del generado por Supabase — agregar `persona_id` como columna nueva y regenerar tipos es mecánico, no hay una definición de tipo a mano que mantener sincronizada.
- Los `hooks` de lectura/escritura de clientes están centralizados en un solo archivo (`useClients.ts`) — no están dispersos por 20 componentes.

**En contra / a decidir antes de tocar código:**
- **Multitenancy**: hay que decidir explícitamente que la sincronización es "hacia la organización de Mejora Continua", no un mapeo genérico — si no, el día que exista otro tenant real, el diseño se rompe conceptualmente.
- **Dirección del dato**: hoy `clients` tiene mucho que `contactos_finales` no tiene (`interactions`, `products`, pipeline) y `contactos_finales` tiene cosas que `clients` no tiene (dedup real, `updated_at`, sincronización). Hay que decidir si `persona_id` se agrega como columna nueva en `clients` (referenciando `contactos_finales.persona_id`) manteniendo `clients.id` como está, o si se reemplaza `clients.id` por `persona_id` directamente — la primera opción es mucho menos invasiva (no toca ninguna FK existente de `interactions`/`interaction_lines`).
- **El dato real pendiente de vaciar** (§2) — si vas a migrar la fuente de verdad, probablemente quieras hacerlo ANTES de decidir si vale la pena migrar el historial viejo de `clients`/`interactions` o arrancar limpio.
- **El hallazgo de seguridad** (arriba de todo) — no bloquea el diseño, pero sí bloquea que sea razonable conectar credenciales nuevas (la API key de `contactos-api`) a un proyecto que todavía tiene una key vieja potencialmente expuesta dando vueltas.

## Preguntas abiertas para decidir juntos (nada de esto se tocó)

1. ¿Confirmás si `clients` en producción tiene datos reales hoy, y cuántos, antes de definir estrategia de migración?
2. `persona_id` en MejoraCRM: ¿columna nueva en `clients` (referenciando `contactos_finales`, `clients.id` se queda como está) o reemplazo de `clients.id`? Recomiendo la primera opción por lo dicho arriba.
3. La sincronización con `contactos_finales`, ¿es de una sola vía (MejoraContactos → MejoraCRM, MejoraCRM nunca escribe contactos nuevos que no pasen por MejoraContactos) o de doble vía (un vendedor puede cargar un cliente nuevo directo en MejoraCRM y eso tiene que viajar de vuelta a MejoraContactos)? Esto cambia bastante el diseño de la integración.
4. ¿Qué pasa con la importación CSV manual de `Clients.tsx` — se deprecia en favor de que todo pase por MejoraContactos, o queda como vía alternativa?
5. Dado el hallazgo de seguridad: ¿querés que te ayude con la rotación de la key y la limpieza del historial de git antes de seguir, o preferís resolverlo vos por tu cuenta primero?
