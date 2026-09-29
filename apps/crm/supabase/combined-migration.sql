-- =====================================================
-- MejoraCRM — Script de migración completo
-- Ejecutar en Supabase SQL Editor
-- Proyecto: fkjuswkjzaeuogctsxpw
-- Fecha: 2026-05-13
-- =====================================================

-- =====================================================
-- PASO 1: Schema base (enums, tablas, RLS)
-- =====================================================

-- Enums
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'supervisor', 'vendedor');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.interaction_result AS ENUM ('presupuesto', 'venta', 'seguimiento', 'sin_respuesta', 'no_interesado');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.interaction_medium AS ENUM ('whatsapp', 'llamada', 'email', 'reunion_presencial', 'reunion_virtual', 'md_instagram', 'md_facebook', 'md_linkedin', 'visita_campo');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.client_status AS ENUM ('activo', 'potencial', 'inactivo');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.currency_code AS ENUM ('ARS', 'USD', 'EUR');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.quote_path AS ENUM ('catalogo', 'adjunto');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.followup_scenario AS ENUM ('vinculado', 'independiente', 'historico');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.negotiation_state AS ENUM ('con_interes', 'sin_respuesta', 'revisando', 'pidio_cambios');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- =====================================================
-- PASO 2: Tablas
-- =====================================================

-- Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- User roles
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'vendedor',
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- has_role function
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- get_user_role function
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = _user_id LIMIT 1
$$;

-- Products
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT,
  price NUMERIC(12,2),
  active BOOLEAN NOT NULL DEFAULT true,
  unit TEXT NOT NULL DEFAULT 'u',
  unit_label TEXT NOT NULL DEFAULT 'Unidad',
  currency public.currency_code NOT NULL DEFAULT 'ARS',
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Clients
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  company TEXT,
  contact_name TEXT,
  segment TEXT,
  location TEXT,
  whatsapp TEXT,
  email TEXT,
  channel TEXT,
  address TEXT,
  province TEXT,
  country TEXT NOT NULL DEFAULT 'Argentina',
  first_contact_date DATE DEFAULT CURRENT_DATE,
  status public.client_status NOT NULL DEFAULT 'potencial',
  notes TEXT,
  assigned_to UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Interactions
CREATE TABLE IF NOT EXISTS public.interactions (
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
ALTER TABLE public.interactions ENABLE ROW LEVEL SECURITY;

-- Interaction lines
CREATE TABLE IF NOT EXISTS public.interaction_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interaction_id UUID NOT NULL REFERENCES public.interactions(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  quantity NUMERIC(14,3) NOT NULL DEFAULT 1,
  unit_price NUMERIC(14,2) NOT NULL DEFAULT 0,
  line_total NUMERIC(14,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.interaction_lines ENABLE ROW LEVEL SECURITY;

-- Audit log
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
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PASO 3: Asegurar columnas faltantes (por si la tabla ya existía)
-- =====================================================
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS country TEXT NOT NULL DEFAULT 'Argentina';
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS province TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS status public.client_status NOT NULL DEFAULT 'potencial';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS unit TEXT NOT NULL DEFAULT 'u';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS unit_label TEXT NOT NULL DEFAULT 'Unidad';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS currency public.currency_code NOT NULL DEFAULT 'ARS';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS description TEXT;

-- =====================================================
-- PASO 4: Índices
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_interactions_client ON public.interactions(client_id);
CREATE INDEX IF NOT EXISTS idx_interactions_user ON public.interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_interactions_date ON public.interactions(interaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_interactions_result ON public.interactions(result);
CREATE INDEX IF NOT EXISTS idx_interactions_follow_up_date ON public.interactions(follow_up_date) WHERE follow_up_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_interactions_client_result ON public.interactions(client_id, result);
CREATE INDEX IF NOT EXISTS idx_interaction_lines_interaction ON public.interaction_lines(interaction_id);
CREATE INDEX IF NOT EXISTS idx_interaction_lines_product ON public.interaction_lines(product_id);
CREATE INDEX IF NOT EXISTS idx_clients_assigned_to ON public.clients(assigned_to);
CREATE INDEX IF NOT EXISTS idx_clients_status ON public.clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_name ON public.clients(name);
CREATE INDEX IF NOT EXISTS idx_clients_country ON public.clients(country);
CREATE INDEX IF NOT EXISTS idx_audit_log_table ON public.audit_log(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_log_record ON public.audit_log(record_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_user ON public.audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON public.audit_log(created_at DESC);

-- =====================================================
-- PASO 4: Triggers
-- =====================================================

-- Updated_at triggers
DO $$ BEGIN
  CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER update_interactions_updated_at BEFORE UPDATE ON public.interactions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'vendedor'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DO $$ BEGIN
  CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Audit triggers
CREATE OR REPLACE FUNCTION public.audit_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  old_json JSONB;
  new_json JSONB;
  changed TEXT[];
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
    SELECT array_agg(key) INTO changed FROM jsonb_each(old_json) e WHERE e.value IS DISTINCT FROM new_json->e.key;
    IF changed IS NOT NULL AND array_length(changed, 1) > 0 THEN
      INSERT INTO public.audit_log (table_name, record_id, action, old_data, new_data, changed_fields, user_id)
      VALUES (TG_TABLE_NAME, NEW.id, 'UPDATE', old_json, new_json, changed, auth.uid());
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;

DO $$ BEGIN
  CREATE TRIGGER audit_clients AFTER INSERT OR UPDATE OR DELETE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER audit_interactions AFTER INSERT OR UPDATE OR DELETE ON public.interactions FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER audit_products AFTER INSERT OR UPDATE OR DELETE ON public.products FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER audit_user_roles AFTER INSERT OR UPDATE OR DELETE ON public.user_roles FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =====================================================
-- PASO 5: RLS Policies
-- =====================================================

-- Profiles
DO $$ BEGIN DROP POLICY IF EXISTS "profiles_select" ON public.profiles; EXCEPTION WHEN undefined_object THEN NULL; END $$;
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT USING (true);

DO $$ BEGIN DROP POLICY IF EXISTS "profiles_update" ON public.profiles; EXCEPTION WHEN undefined_object THEN NULL; END $$;
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

DO $$ BEGIN DROP POLICY IF EXISTS "profiles_insert" ON public.profiles; EXCEPTION WHEN undefined_object THEN NULL; END $$;
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

DO $$ BEGIN DROP POLICY IF EXISTS "profiles_delete" ON public.profiles; EXCEPTION WHEN undefined_object THEN NULL; END $$;
CREATE POLICY "profiles_delete" ON public.profiles FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- User roles
DO $$ BEGIN DROP POLICY IF EXISTS "user_roles_select" ON public.user_roles; EXCEPTION WHEN undefined_object THEN NULL; END $$;
CREATE POLICY "user_roles_select" ON public.user_roles FOR SELECT USING (true);

DO $$ BEGIN DROP POLICY IF EXISTS "user_roles_insert" ON public.user_roles; EXCEPTION WHEN undefined_object THEN NULL; END $$;
CREATE POLICY "user_roles_insert" ON public.user_roles FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

DO $$ BEGIN DROP POLICY IF EXISTS "user_roles_update" ON public.user_roles; EXCEPTION WHEN undefined_object THEN NULL; END $$;
CREATE POLICY "user_roles_update" ON public.user_roles FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

DO $$ BEGIN DROP POLICY IF EXISTS "user_roles_delete" ON public.user_roles; EXCEPTION WHEN undefined_object THEN NULL; END $$;
CREATE POLICY "user_roles_delete" ON public.user_roles FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- Products
DO $$ BEGIN DROP POLICY IF EXISTS "products_select" ON public.products; EXCEPTION WHEN undefined_object THEN NULL; END $$;
CREATE POLICY "products_select" ON public.products FOR SELECT USING (true);

DO $$ BEGIN DROP POLICY IF EXISTS "products_insert" ON public.products; EXCEPTION WHEN undefined_object THEN NULL; END $$;
CREATE POLICY "products_insert" ON public.products FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'supervisor'));

DO $$ BEGIN DROP POLICY IF EXISTS "products_update" ON public.products; EXCEPTION WHEN undefined_object THEN NULL; END $$;
CREATE POLICY "products_update" ON public.products FOR UPDATE USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'supervisor'));

DO $$ BEGIN DROP POLICY IF EXISTS "products_delete" ON public.products; EXCEPTION WHEN undefined_object THEN NULL; END $$;
CREATE POLICY "products_delete" ON public.products FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- Clients
DO $$ BEGIN DROP POLICY IF EXISTS "clients_select" ON public.clients; EXCEPTION WHEN undefined_object THEN NULL; END $$;
CREATE POLICY "clients_select" ON public.clients FOR SELECT USING (
  assigned_to = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'supervisor')
);

DO $$ BEGIN DROP POLICY IF EXISTS "clients_insert" ON public.clients; EXCEPTION WHEN undefined_object THEN NULL; END $$;
CREATE POLICY "clients_insert" ON public.clients FOR INSERT WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'supervisor')
  OR (auth.uid() IS NOT NULL AND assigned_to = auth.uid())
);

DO $$ BEGIN DROP POLICY IF EXISTS "clients_update" ON public.clients; EXCEPTION WHEN undefined_object THEN NULL; END $$;
CREATE POLICY "clients_update" ON public.clients FOR UPDATE USING (
  assigned_to = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'supervisor')
);

DO $$ BEGIN DROP POLICY IF EXISTS "clients_delete" ON public.clients; EXCEPTION WHEN undefined_object THEN NULL; END $$;
CREATE POLICY "clients_delete" ON public.clients FOR DELETE USING (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'supervisor')
);

-- Interactions
DO $$ BEGIN DROP POLICY IF EXISTS "interactions_select" ON public.interactions; EXCEPTION WHEN undefined_object THEN NULL; END $$;
CREATE POLICY "interactions_select" ON public.interactions FOR SELECT USING (
  user_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'supervisor')
);

DO $$ BEGIN DROP POLICY IF EXISTS "interactions_insert" ON public.interactions; EXCEPTION WHEN undefined_object THEN NULL; END $$;
CREATE POLICY "interactions_insert" ON public.interactions FOR INSERT WITH CHECK (auth.uid() = user_id);

DO $$ BEGIN DROP POLICY IF EXISTS "interactions_update" ON public.interactions; EXCEPTION WHEN undefined_object THEN NULL; END $$;
CREATE POLICY "interactions_update" ON public.interactions FOR UPDATE USING (
  user_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'supervisor')
);

DO $$ BEGIN DROP POLICY IF EXISTS "interactions_delete" ON public.interactions; EXCEPTION WHEN undefined_object THEN NULL; END $$;
CREATE POLICY "interactions_delete" ON public.interactions FOR DELETE USING (
  user_id = auth.uid() OR public.has_role(auth.uid(), 'admin')
);

-- Interaction lines
DO $$ BEGIN DROP POLICY IF EXISTS "interaction_lines_select" ON public.interaction_lines; EXCEPTION WHEN undefined_object THEN NULL; END $$;
CREATE POLICY "interaction_lines_select" ON public.interaction_lines FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.interactions i WHERE i.id = interaction_lines.interaction_id
    AND (i.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'supervisor')))
);

DO $$ BEGIN DROP POLICY IF EXISTS "interaction_lines_insert" ON public.interaction_lines; EXCEPTION WHEN undefined_object THEN NULL; END $$;
CREATE POLICY "interaction_lines_insert" ON public.interaction_lines FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.interactions i WHERE i.id = interaction_lines.interaction_id AND i.user_id = auth.uid())
);

DO $$ BEGIN DROP POLICY IF EXISTS "interaction_lines_update" ON public.interaction_lines; EXCEPTION WHEN undefined_object THEN NULL; END $$;
CREATE POLICY "interaction_lines_update" ON public.interaction_lines FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.interactions i WHERE i.id = interaction_lines.interaction_id
    AND (i.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin')))
);

DO $$ BEGIN DROP POLICY IF EXISTS "interaction_lines_delete" ON public.interaction_lines; EXCEPTION WHEN undefined_object THEN NULL; END $$;
CREATE POLICY "interaction_lines_delete" ON public.interaction_lines FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.interactions i WHERE i.id = interaction_lines.interaction_id
    AND (i.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin')))
);

-- Audit log
DO $$ BEGIN DROP POLICY IF EXISTS "audit_log_select" ON public.audit_log; EXCEPTION WHEN undefined_object THEN NULL; END $$;
CREATE POLICY "audit_log_select" ON public.audit_log FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- =====================================================
-- PASO 6: RPC Functions
-- =====================================================

-- Dashboard data
CREATE OR REPLACE FUNCTION public.get_dashboard_data()
RETURNS JSON LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE result JSON;
BEGIN
  SELECT json_build_object(
    'interactions', (SELECT COALESCE(json_agg(i.*), '[]'::json) FROM (
      SELECT i.*, row_to_json(c.*) AS client,
        COALESCE((SELECT json_agg(json_build_object('quantity', il.quantity, 'unit_price', il.unit_price, 'line_total', il.line_total, 'product', row_to_json(p.*)))
          FROM public.interaction_lines il LEFT JOIN public.products p ON p.id = il.product_id WHERE il.interaction_id = i.id), '[]'::json) AS interaction_lines
      FROM public.interactions i LEFT JOIN public.clients c ON c.id = i.client_id
      WHERE i.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'supervisor')
      ORDER BY i.interaction_date DESC
    ) i),
    'clients', (SELECT COALESCE(json_agg(c.*), '[]'::json) FROM public.clients c
      WHERE c.assigned_to = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'supervisor')),
    'profiles', (SELECT COALESCE(json_agg(json_build_object('user_id', p.user_id, 'full_name', p.full_name)), '[]'::json) FROM public.profiles p)
  ) INTO result;
  RETURN result;
END;
$$;

-- Seller ranking
CREATE OR REPLACE FUNCTION public.get_seller_ranking(period_start TIMESTAMPTZ)
RETURNS JSON LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN (SELECT COALESCE(json_agg(r.*), '[]'::json) FROM (
    SELECT p.user_id, p.full_name,
      COUNT(*) FILTER (WHERE i.result = 'venta') AS ventas,
      COUNT(*) FILTER (WHERE i.result = 'presupuesto') AS presupuestos,
      COUNT(*) FILTER (WHERE i.result = 'seguimiento') AS seguimientos,
      COALESCE(SUM(i.total_amount) FILTER (WHERE i.result = 'venta'), 0) AS ingresos
    FROM public.profiles p LEFT JOIN public.interactions i ON i.user_id = p.user_id AND i.interaction_date >= period_start
    GROUP BY p.user_id, p.full_name HAVING COUNT(i.id) > 0
    ORDER BY COALESCE(SUM(i.total_amount) FILTER (WHERE i.result = 'venta'), 0) DESC
  ) r);
END;
$$;

-- Account deletion
CREATE OR REPLACE FUNCTION request_account_deletion()
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _user_id UUID := auth.uid(); _clients_count INT; _interactions_count INT;
BEGIN
  IF _user_id IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'No autenticado'); END IF;
  SELECT COUNT(*) INTO _clients_count FROM clients WHERE assigned_to = _user_id;
  SELECT COUNT(*) INTO _interactions_count FROM interactions WHERE user_id = _user_id;
  UPDATE profiles SET full_name = 'Usuario eliminado', avatar_url = NULL, updated_at = now() WHERE user_id = _user_id;
  DELETE FROM interactions WHERE user_id = _user_id;
  DELETE FROM clients WHERE assigned_to = _user_id;
  DELETE FROM user_roles WHERE user_id = _user_id;
  RETURN jsonb_build_object('success', true, 'clients_deleted', _clients_count, 'interactions_deleted', _interactions_count, 'message', 'Datos eliminados correctamente.');
END;
$$;

GRANT EXECUTE ON FUNCTION request_account_deletion() TO authenticated;

-- =====================================================
-- PASO 7: Seed data (productos de ejemplo)
-- =====================================================
INSERT INTO public.products (name, category, price, unit, unit_label, currency, description) VALUES
  ('Plantines de Eucalipto', 'Forestal', 150.00, 'u', 'Unidad', 'ARS', 'Plantines de eucalipto de alta calidad'),
  ('Plantines de Pino', 'Forestal', 120.00, 'u', 'Unidad', 'ARS', 'Plantines de pino para forestación'),
  ('Servicio de Poda', 'Servicios', 5000.00, 'servicio', 'Servicio', 'ARS', 'Servicio de poda profesional'),
  ('Servicio de Raleo', 'Servicios', 8000.00, 'servicio', 'Servicio', 'ARS', 'Servicio de raleo forestal'),
  ('Madera Aserrada', 'Productos', 25000.00, 'm3', 'Metro cúbico', 'ARS', 'Madera aserrada de primera calidad'),
  ('Chips de Madera', 'Productos', 15000.00, 'tn', 'Tonelada', 'ARS', 'Chips de madera para biomasa'),
  ('Consultoría Forestal', 'Servicios', 10000.00, 'hr', 'Hora', 'ARS', 'Consultoría especializada en forestación'),
  ('Fertilizantes', 'Insumos', 3500.00, 'kg', 'Kilogramo', 'ARS', 'Fertilizantes para plantaciones'),
  ('Herbicidas', 'Insumos', 4200.00, 'lt', 'Litro', 'ARS', 'Herbicidas para control de malezas'),
  ('Maquinaria (alquiler)', 'Servicios', 20000.00, 'hr', 'Hora', 'ARS', 'Alquiler de maquinaria forestal')
ON CONFLICT DO NOTHING;

-- =====================================================
-- ¡Listo! La base de datos está configurada.
-- Ahora creá los usuarios en Authentication > Users
-- =====================================================
