-- ==============================================================
-- MejoraCRM — Multitenancy: reescritura de RLS policies
-- Todas las políticas ahora filtran explícitamente por organization_id.
-- has_role() ya es org-aware (ver migración anterior), pero se agrega
-- la condición explícita organization_id = current_org_id() para
-- defensa en profundidad.
-- ==============================================================

-- ── organizations ──────────────────────────────────────────────
CREATE POLICY "orgs_select" ON public.organizations
  FOR SELECT USING (id = public.current_org_id());

CREATE POLICY "orgs_update" ON public.organizations
  FOR UPDATE USING (
    id = public.current_org_id()
    AND public.has_role(auth.uid(), 'admin')
  );

-- ── profiles ───────────────────────────────────────────────────
-- Reemplaza la política SELECT que era USING (true)
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT USING (
    organization_id = public.current_org_id()
    OR user_id = auth.uid()
  );

-- ── user_roles ─────────────────────────────────────────────────
DROP POLICY IF EXISTS "user_roles_select" ON public.user_roles;
CREATE POLICY "user_roles_select" ON public.user_roles
  FOR SELECT USING (organization_id = public.current_org_id());

DROP POLICY IF EXISTS "user_roles_insert" ON public.user_roles;
CREATE POLICY "user_roles_insert" ON public.user_roles
  FOR INSERT WITH CHECK (
    organization_id = public.current_org_id()
    AND public.has_role(auth.uid(), 'admin')
  );

DROP POLICY IF EXISTS "user_roles_update" ON public.user_roles;
CREATE POLICY "user_roles_update" ON public.user_roles
  FOR UPDATE USING (
    organization_id = public.current_org_id()
    AND public.has_role(auth.uid(), 'admin')
  );

DROP POLICY IF EXISTS "user_roles_delete" ON public.user_roles;
CREATE POLICY "user_roles_delete" ON public.user_roles
  FOR DELETE USING (
    organization_id = public.current_org_id()
    AND public.has_role(auth.uid(), 'admin')
  );

-- ── clients ────────────────────────────────────────────────────
DROP POLICY IF EXISTS "clients_select" ON public.clients;
CREATE POLICY "clients_select" ON public.clients
  FOR SELECT USING (
    organization_id = public.current_org_id()
    AND (
      assigned_to = auth.uid()
      OR public.has_role(auth.uid(), 'admin')
      OR public.has_role(auth.uid(), 'supervisor')
    )
  );

DROP POLICY IF EXISTS "clients_insert" ON public.clients;
CREATE POLICY "clients_insert" ON public.clients
  FOR INSERT WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'supervisor')
    OR (auth.uid() IS NOT NULL AND assigned_to = auth.uid())
  );

DROP POLICY IF EXISTS "clients_update" ON public.clients;
CREATE POLICY "clients_update" ON public.clients
  FOR UPDATE USING (
    organization_id = public.current_org_id()
    AND (
      assigned_to = auth.uid()
      OR public.has_role(auth.uid(), 'admin')
      OR public.has_role(auth.uid(), 'supervisor')
    )
  );

DROP POLICY IF EXISTS "clients_delete" ON public.clients;
CREATE POLICY "clients_delete" ON public.clients
  FOR DELETE USING (
    organization_id = public.current_org_id()
    AND (
      public.has_role(auth.uid(), 'admin')
      OR public.has_role(auth.uid(), 'supervisor')
    )
  );

-- ── products ───────────────────────────────────────────────────
DROP POLICY IF EXISTS "products_select" ON public.products;
CREATE POLICY "products_select" ON public.products
  FOR SELECT USING (organization_id = public.current_org_id());

DROP POLICY IF EXISTS "products_insert" ON public.products;
CREATE POLICY "products_insert" ON public.products
  FOR INSERT WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'supervisor')
  );

DROP POLICY IF EXISTS "products_update" ON public.products;
CREATE POLICY "products_update" ON public.products
  FOR UPDATE USING (
    organization_id = public.current_org_id()
    AND (
      public.has_role(auth.uid(), 'admin')
      OR public.has_role(auth.uid(), 'supervisor')
    )
  );

DROP POLICY IF EXISTS "products_delete" ON public.products;
CREATE POLICY "products_delete" ON public.products
  FOR DELETE USING (
    organization_id = public.current_org_id()
    AND public.has_role(auth.uid(), 'admin')
  );

-- ── interactions ───────────────────────────────────────────────
DROP POLICY IF EXISTS "interactions_select" ON public.interactions;
CREATE POLICY "interactions_select" ON public.interactions
  FOR SELECT USING (
    organization_id = public.current_org_id()
    AND (
      user_id = auth.uid()
      OR public.has_role(auth.uid(), 'admin')
      OR public.has_role(auth.uid(), 'supervisor')
    )
  );

DROP POLICY IF EXISTS "interactions_insert" ON public.interactions;
CREATE POLICY "interactions_insert" ON public.interactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "interactions_update" ON public.interactions;
CREATE POLICY "interactions_update" ON public.interactions
  FOR UPDATE USING (
    organization_id = public.current_org_id()
    AND (
      user_id = auth.uid()
      OR public.has_role(auth.uid(), 'admin')
      OR public.has_role(auth.uid(), 'supervisor')
    )
  );

DROP POLICY IF EXISTS "interactions_delete" ON public.interactions;
CREATE POLICY "interactions_delete" ON public.interactions
  FOR DELETE USING (
    organization_id = public.current_org_id()
    AND (
      user_id = auth.uid()
      OR public.has_role(auth.uid(), 'admin')
    )
  );
