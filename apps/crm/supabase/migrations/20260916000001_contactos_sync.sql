-- ==============================================================
-- MejoraCRM — Sincronización de doble vía con MejoraContactos
-- ==============================================================
-- Ver INFORME-SINCRONIZACION-CONTACTOS.md (raíz de este repo) para el
-- diseño completo. Resumen: contactos_finales (proyecto Supabase de
-- MejoraContactos) pasa a ser la fuente de verdad de identidad de
-- contactos; clients acá guarda una referencia (persona_id) a esa fila,
-- sin reemplazar clients.id (ninguna FK existente de interactions/
-- interaction_lines se toca).
--
-- Esta migración es puramente aditiva: columnas nuevas nullable, una
-- tabla de auditoría nueva. No borra ni renombra nada existente, no
-- rompe compatibilidad con clients.id como está usado hoy en el resto
-- del código.

ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS persona_id UUID,
  ADD COLUMN IF NOT EXISTS origen TEXT NOT NULL DEFAULT 'mejoracrm',
  ADD COLUMN IF NOT EXISTS contactos_synced_at TIMESTAMPTZ;

ALTER TABLE public.clients
  ADD CONSTRAINT chk_clients_origen CHECK (origen IN ('mejoracrm', 'motor-contactos'));

-- persona_id es único CUANDO está presente (muchos clients todavía no
-- tienen uno, no fuerza NOT NULL -- ver "Rollout" en el informe para el
-- backfill gradual).
CREATE UNIQUE INDEX IF NOT EXISTS idx_clients_persona_id ON public.clients(persona_id) WHERE persona_id IS NOT NULL;

COMMENT ON COLUMN public.clients.persona_id IS 'Referencia estable a contactos_finales.persona_id (proyecto Supabase de MejoraContactos). NULL = todavía no sincronizado.';
COMMENT ON COLUMN public.clients.origen IS 'Dónde se creó este cliente por primera vez: mejoracrm (alta manual/import CSV) o motor-contactos (llegó vía sync-contactos-pull). No cambia después.';
COMMENT ON COLUMN public.clients.contactos_synced_at IS 'Última vez que esta fila se sincronizó exitosamente (en cualquier dirección) con contactos_finales.';

-- contactos_sync_log: auditoría local de cada corrida de push/pull. Réplica
-- del mismo concepto que contactos_sync_log en el proyecto de
-- MejoraContactos -- son dos tablas separadas (dos proyectos Supabase
-- distintos), cada una audita lo que pasó de SU lado.
CREATE TABLE IF NOT EXISTS public.contactos_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  direccion TEXT NOT NULL CHECK (direccion IN ('push', 'pull')),
  cantidad INTEGER NOT NULL DEFAULT 0,
  exito BOOLEAN NOT NULL,
  error TEXT,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contactos_sync_log_fecha ON public.contactos_sync_log(creado_en DESC);

ALTER TABLE public.contactos_sync_log ENABLE ROW LEVEL SECURITY;

-- Lectura: cualquier usuario autenticado de la organización puede ver el
-- log de sincronización (es información operativa, no de un cliente
-- puntual -- no hay nada sensible acá, solo conviene no exponerlo a anon).
CREATE POLICY "contactos_sync_log_select" ON public.contactos_sync_log
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Escritura: solo las Edge Functions (service_role, bypassea RLS de
-- cualquier forma) -- sin política de INSERT/UPDATE/DELETE a propósito,
-- ningún usuario ni siquiera admin debe poder escribir acá a mano.
