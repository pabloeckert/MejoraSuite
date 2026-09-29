
-- Enums
CREATE TYPE public.app_role AS ENUM ('admin', 'supervisor', 'vendedor');
CREATE TYPE public.client_status AS ENUM ('lead', 'cliente', 'inactivo');
CREATE TYPE public.interaction_medium AS ENUM ('whatsapp', 'email', 'llamada', 'redes', 'reunion');
CREATE TYPE public.interaction_type AS ENUM ('consulta', 'cotizacion', 'seguimiento', 'cierre');
CREATE TYPE public.interaction_result AS ENUM ('interes', 'venta', 'sin_respuesta', 'rechazo');
CREATE TYPE public.opportunity_stage AS ENUM ('prospecto', 'contactado', 'cotizacion', 'negociacion', 'cerrado_ganado', 'cerrado_perdido');

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- User roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'vendedor',
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- has_role security definer function
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

-- get_user_role function
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = _user_id LIMIT 1
$$;

-- Products
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT,
  price NUMERIC(12,2),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Clients
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
  status client_status NOT NULL DEFAULT 'lead',
  notes TEXT,
  assigned_to UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Interactions
CREATE TABLE public.interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  interaction_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  medium interaction_medium NOT NULL,
  type interaction_type NOT NULL,
  product_id UUID REFERENCES public.products(id),
  result interaction_result,
  next_step TEXT,
  follow_up_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.interactions ENABLE ROW LEVEL SECURITY;

-- Opportunities
CREATE TABLE public.opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id),
  stage opportunity_stage NOT NULL DEFAULT 'prospecto',
  estimated_amount NUMERIC(12,2),
  loss_reason TEXT,
  assigned_to UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;

-- Triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_opportunities_updated_at BEFORE UPDATE ON public.opportunities FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

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

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS Policies
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_roles_select" ON public.user_roles FOR SELECT USING (true);
CREATE POLICY "user_roles_insert" ON public.user_roles FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "user_roles_update" ON public.user_roles FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "user_roles_delete" ON public.user_roles FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "products_select" ON public.products FOR SELECT USING (true);
CREATE POLICY "products_manage" ON public.products FOR ALL USING (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'supervisor')
);

CREATE POLICY "clients_select" ON public.clients FOR SELECT USING (
  assigned_to = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'supervisor')
);
CREATE POLICY "clients_insert" ON public.clients FOR INSERT WITH CHECK (true);
CREATE POLICY "clients_update" ON public.clients FOR UPDATE USING (
  assigned_to = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'supervisor')
);
CREATE POLICY "clients_delete" ON public.clients FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "interactions_select" ON public.interactions FOR SELECT USING (
  user_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'supervisor')
);
CREATE POLICY "interactions_insert" ON public.interactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "interactions_update" ON public.interactions FOR UPDATE USING (
  user_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'supervisor')
);

CREATE POLICY "opportunities_select" ON public.opportunities FOR SELECT USING (
  assigned_to = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'supervisor')
);
CREATE POLICY "opportunities_insert" ON public.opportunities FOR INSERT WITH CHECK (auth.uid() = assigned_to);
CREATE POLICY "opportunities_update" ON public.opportunities FOR UPDATE USING (
  assigned_to = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'supervisor')
);
CREATE POLICY "opportunities_delete" ON public.opportunities FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- Seed products
INSERT INTO public.products (name, category, price) VALUES
  ('Plantines de Eucalipto', 'Forestal', 150.00),
  ('Plantines de Pino', 'Forestal', 120.00),
  ('Servicio de Poda', 'Servicios', 5000.00),
  ('Servicio de Raleo', 'Servicios', 8000.00),
  ('Madera Aserrada', 'Productos', 25000.00),
  ('Chips de Madera', 'Productos', 15000.00),
  ('Consultoría Forestal', 'Servicios', 10000.00),
  ('Fertilizantes', 'Insumos', 3500.00),
  ('Herbicidas', 'Insumos', 4200.00),
  ('Maquinaria (alquiler)', 'Servicios', 20000.00);
