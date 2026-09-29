-- =====================================================
-- MejoraCRM — Audit log para trazabilidad
-- Fecha: 2026-04-24
-- Descripción: Registra quién hizo qué, cuándo y en
--              qué registro. Trigger automático en
--              tablas críticas (clients, interactions,
--              products, user_roles).
-- =====================================================

-- 1. Tabla de audit log
CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  old_data JSONB,
  new_data JSONB,
  changed_fields TEXT[],
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Índices para queries frecuentes
CREATE INDEX IF NOT EXISTS idx_audit_log_table ON public.audit_log(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_log_record ON public.audit_log(record_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_user ON public.audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON public.audit_log(created_at DESC);

-- 3. RLS: solo admin puede ver audit log
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_log_select" ON public.audit_log
FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- 4. Función trigger genérica
CREATE OR REPLACE FUNCTION public.audit_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  old_json JSONB;
  new_json JSONB;
  changed TEXT[];
  key TEXT;
BEGIN
  IF TG_OP = 'DELETE' THEN
    old_json := to_jsonb(OLD);
    INSERT INTO public.audit_log (table_name, record_id, action, old_data, user_id)
    VALUES (TG_TABLE_NAME, OLD.id, 'DELETE', old_json, auth.uid());
    RETURN OLD;
  END IF;

  IF TG_OP = 'INSERT' THEN
    new_json := to_jsonb(NEW);
    INSERT INTO public.audit_log (table_name, record_id, action, new_data, user_id)
    VALUES (TG_TABLE_NAME, NEW.id, 'INSERT', new_json, auth.uid());
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    old_json := to_jsonb(OLD);
    new_json := to_jsonb(NEW);

    -- Detect changed fields
    SELECT array_agg(key) INTO changed
    FROM jsonb_each(old_json) e
    WHERE e.value IS DISTINCT FROM new_json->e.key;

    -- Only log if something actually changed
    IF changed IS NOT NULL AND array_length(changed, 1) > 0 THEN
      INSERT INTO public.audit_log (table_name, record_id, action, old_data, new_data, changed_fields, user_id)
      VALUES (TG_TABLE_NAME, NEW.id, 'UPDATE', old_json, new_json, changed, auth.uid());
    END IF;

    RETURN NEW;
  END IF;

  RETURN NULL;
END;
$$;

-- 5. Triggers en tablas críticas
CREATE TRIGGER audit_clients
  AFTER INSERT OR UPDATE OR DELETE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();

CREATE TRIGGER audit_interactions
  AFTER INSERT OR UPDATE OR DELETE ON public.interactions
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();

CREATE TRIGGER audit_products
  AFTER INSERT OR UPDATE OR DELETE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();

CREATE TRIGGER audit_user_roles
  AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();

-- 6. Cleanup function (opcional: borrar logs > 90 días)
CREATE OR REPLACE FUNCTION public.cleanup_audit_log(days_to_keep INTEGER DEFAULT 90)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted INTEGER;
BEGIN
  DELETE FROM public.audit_log
  WHERE created_at < now() - (days_to_keep || ' days')::INTERVAL;
  GET DIAGNOSTICS deleted = ROW_COUNT;
  RETURN deleted;
END;
$$;
