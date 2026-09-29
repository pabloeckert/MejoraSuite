
-- =====================================================
-- MEJORA CRM v2 — Migración completa del modelo
-- =====================================================

-- 1) Borrar tabla pipeline
DROP TABLE IF EXISTS public.opportunities CASCADE;

-- 2) Borrar interactions
DROP TABLE IF EXISTS public.interactions CASCADE;

-- 3) Borrar enums viejos (esto también dropea columnas que dependan de ellos)
DROP TYPE IF EXISTS public.opportunity_stage CASCADE;
DROP TYPE IF EXISTS public.interaction_type CASCADE;
DROP TYPE IF EXISTS public.interaction_result CASCADE;
DROP TYPE IF EXISTS public.interaction_medium CASCADE;
DROP TYPE IF EXISTS public.client_status CASCADE;

-- =====================================================
-- ENUMS v2
-- =====================================================
CREATE TYPE public.interaction_result AS ENUM (
  'presupuesto',
  'venta',
  'seguimiento',
  'sin_respuesta',
  'no_interesado'
);

CREATE TYPE public.interaction_medium AS ENUM (
  'whatsapp',
  'llamada',
  'email',
  'reunion_presencial',
  'reunion_virtual',
  'md_instagram',
  'md_facebook',
  'md_linkedin',
  'visita_campo'
);

CREATE TYPE public.client_status AS ENUM (
  'activo',
  'potencial',
  'inactivo'
);

CREATE TYPE public.currency_code AS ENUM ('ARS', 'USD', 'EUR');

CREATE TYPE public.quote_path AS ENUM ('catalogo', 'adjunto');

CREATE TYPE public.followup_scenario AS ENUM (
  'vinculado',
  'independiente',
  'historico'
);

CREATE TYPE public.negotiation_state AS ENUM (
  'con_interes',
  'sin_respuesta',
  'revisando',
  'pidio_cambios'
);

-- =====================================================
-- PRODUCTS v2
-- =====================================================
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS unit TEXT NOT NULL DEFAULT 'u',
  ADD COLUMN IF NOT EXISTS unit_label TEXT NOT NULL DEFAULT 'Unidad',
  ADD COLUMN IF NOT EXISTS currency public.currency_code NOT NULL DEFAULT 'ARS',
  ADD COLUMN IF NOT EXISTS description TEXT;

-- =====================================================
-- CLIENTS v2 — re-crear columna status (se eliminó por CASCADE)
-- =====================================================
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS status public.client_status NOT NULL DEFAULT 'potencial',
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS province TEXT;

-- =====================================================
-- INTERACTIONS v2
-- =====================================================
CREATE TABLE public.interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  interaction_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  result public.interaction_result NOT NULL,
  medium public.interaction_medium NOT NULL,

  quote_path public.quote_path,
  total_amount NUMERIC(14,2),
  currency public.currency_code,
  attachment_url TEXT,
  reference_quote_id UUID REFERENCES public.interactions(id) ON DELETE SET NULL,

  followup_scenario public.followup_scenario,
  negotiation_state public.negotiation_state,
  followup_motive TEXT,
  historic_quote_amount NUMERIC(14,2),
  historic_quote_date DATE,

  loss_reason TEXT,
  estimated_loss NUMERIC(14,2),

  next_step TEXT,
  follow_up_date DATE,
  notes TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_interactions_client ON public.interactions(client_id);
CREATE INDEX idx_interactions_user ON public.interactions(user_id);
CREATE INDEX idx_interactions_date ON public.interactions(interaction_date DESC);
CREATE INDEX idx_interactions_result ON public.interactions(result);

ALTER TABLE public.interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "interactions_select" ON public.interactions
FOR SELECT USING (
  user_id = auth.uid()
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'supervisor')
);

CREATE POLICY "interactions_insert" ON public.interactions
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "interactions_update" ON public.interactions
FOR UPDATE USING (
  user_id = auth.uid()
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'supervisor')
);

CREATE POLICY "interactions_delete" ON public.interactions
FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_interactions_updated_at
BEFORE UPDATE ON public.interactions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- INTERACTION LINES (productos del presupuesto/venta)
-- =====================================================
CREATE TABLE public.interaction_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interaction_id UUID NOT NULL REFERENCES public.interactions(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  quantity NUMERIC(14,3) NOT NULL DEFAULT 1,
  unit_price NUMERIC(14,2) NOT NULL DEFAULT 0,
  line_total NUMERIC(14,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_interaction_lines_interaction ON public.interaction_lines(interaction_id);
CREATE INDEX idx_interaction_lines_product ON public.interaction_lines(product_id);

ALTER TABLE public.interaction_lines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "interaction_lines_select" ON public.interaction_lines
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.interactions i
    WHERE i.id = interaction_lines.interaction_id
    AND (
      i.user_id = auth.uid()
      OR public.has_role(auth.uid(), 'admin')
      OR public.has_role(auth.uid(), 'supervisor')
    )
  )
);

CREATE POLICY "interaction_lines_insert" ON public.interaction_lines
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.interactions i
    WHERE i.id = interaction_lines.interaction_id
    AND i.user_id = auth.uid()
  )
);

CREATE POLICY "interaction_lines_update" ON public.interaction_lines
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.interactions i
    WHERE i.id = interaction_lines.interaction_id
    AND (i.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  )
);

CREATE POLICY "interaction_lines_delete" ON public.interaction_lines
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.interactions i
    WHERE i.id = interaction_lines.interaction_id
    AND (i.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  )
);

-- =====================================================
-- Función Estado del cliente (calculado)
-- =====================================================
CREATE OR REPLACE FUNCTION public.calculate_client_status(_client_id UUID)
RETURNS public.client_status
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  has_recent_positive BOOLEAN;
  has_any_recent BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.interactions
    WHERE client_id = _client_id
      AND result IN ('presupuesto', 'venta')
      AND interaction_date >= now() - INTERVAL '90 days'
  ) INTO has_recent_positive;

  IF has_recent_positive THEN
    RETURN 'activo';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.interactions
    WHERE client_id = _client_id
      AND interaction_date >= now() - INTERVAL '90 days'
  ) INTO has_any_recent;

  IF has_any_recent THEN
    RETURN 'potencial';
  END IF;

  RETURN 'inactivo';
END;
$$;
