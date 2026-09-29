-- ==============================================================
-- MejoraCRM — Multitenancy: tabla organizations y columnas org_id
-- ==============================================================

-- 1. Tabla organizations
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  plan TEXT NOT NULL DEFAULT 'free',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Agregar organization_id a todas las tablas de datos (nullable para migración)
ALTER TABLE public.profiles    ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.user_roles  ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.clients     ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.products    ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.interactions ADD COLUMN organization_id UUID REFERENCES public.organizations(id);

-- Índices de rendimiento
CREATE INDEX idx_profiles_organization    ON public.profiles(organization_id);
CREATE INDEX idx_user_roles_organization  ON public.user_roles(organization_id);
CREATE INDEX idx_clients_organization     ON public.clients(organization_id);
CREATE INDEX idx_products_organization    ON public.products(organization_id);
CREATE INDEX idx_interactions_organization ON public.interactions(organization_id);

-- 3. Función helper current_org_id() — retorna la org del usuario autenticado
CREATE OR REPLACE FUNCTION public.current_org_id()
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
$$;

-- 4. Actualizar has_role() para ser org-aware
-- Al filtrar por organization_id, todas las RLS policies existentes quedan scoped a la org
-- sin necesidad de modificar cada policy individualmente.
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
      AND organization_id = public.current_org_id()
  )
$$;

-- Actualizar get_user_role() para retornar el rol en la org actual del usuario
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT role FROM public.user_roles
  WHERE user_id = _user_id
    AND organization_id = (
      SELECT organization_id FROM public.profiles WHERE user_id = _user_id
    )
  LIMIT 1
$$;

-- 5. Trigger para auto-asignar organization_id en inserts
-- Los hooks del frontend no necesitan cambios — el trigger lo resuelve.
CREATE OR REPLACE FUNCTION public.set_organization_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.organization_id IS NULL THEN
    NEW.organization_id := public.current_org_id();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER set_org_id_clients
  BEFORE INSERT ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.set_organization_id();

CREATE TRIGGER set_org_id_products
  BEFORE INSERT ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.set_organization_id();

CREATE TRIGGER set_org_id_interactions
  BEFORE INSERT ON public.interactions
  FOR EACH ROW EXECUTE FUNCTION public.set_organization_id();

-- 6. Actualizar handle_new_user — ahora crea org + profile + rol admin en una transacción
-- company_name viene en raw_user_meta_data (enviado desde el signup del frontend)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_org_id UUID;
  company    TEXT;
BEGIN
  company := COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'company_name'), ''), 'Mi Empresa');

  INSERT INTO public.organizations (name, created_by)
  VALUES (company, NEW.id)
  RETURNING id INTO new_org_id;

  INSERT INTO public.profiles (user_id, full_name, organization_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    new_org_id
  );

  INSERT INTO public.user_roles (user_id, role, organization_id)
  VALUES (NEW.id, 'admin', new_org_id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 7. RPC create_organization_with_admin — para invite flows futuros o corrección manual
CREATE OR REPLACE FUNCTION public.create_organization_with_admin(org_name TEXT)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_org_id UUID;
BEGIN
  INSERT INTO public.organizations (name, created_by)
  VALUES (org_name, auth.uid())
  RETURNING id INTO new_org_id;

  UPDATE public.profiles
  SET organization_id = new_org_id
  WHERE user_id = auth.uid();

  INSERT INTO public.user_roles (user_id, role, organization_id)
  VALUES (auth.uid(), 'admin', new_org_id)
  ON CONFLICT (user_id, role) DO UPDATE SET organization_id = new_org_id;

  RETURN new_org_id;
END;
$$;
