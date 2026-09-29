-- =====================================================
-- MejoraCRM — Endurecimiento de políticas RLS
-- Fecha: 2026-04-23
-- Descripción: Corrige políticas demasiado permisivas
--              y agrega faltantes. No rompe funcionalidad
--              existente del frontend.
-- =====================================================

-- =====================================================
-- CLIENTS: Endurecer INSERT
-- Antes: cualquier usuario autenticado puede crear clientes
-- Ahora: solo vendedor asignado, admin o supervisor
-- El frontend ya envía assigned_to al crear, así que no rompe
-- =====================================================
DROP POLICY IF EXISTS "clients_insert" ON public.clients;
CREATE POLICY "clients_insert" ON public.clients
FOR INSERT WITH CHECK (
  -- Admin o supervisor puede crear cualquiera
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'supervisor')
  -- Vendedor solo puede crear clientes asignados a sí mismo
  OR (auth.uid() IS NOT NULL AND assigned_to = auth.uid())
);

-- =====================================================
-- PRODUCTS: Separar INSERT de UPDATE/DELETE
-- Antes: una sola política ALL para admin+supervisor
-- Ahora: más granular
-- =====================================================
DROP POLICY IF EXISTS "products_manage" ON public.products;

-- Admin y supervisor pueden crear productos
CREATE POLICY "products_insert" ON public.products
FOR INSERT WITH CHECK (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'supervisor')
);

-- Admin y supervisor pueden actualizar productos
CREATE POLICY "products_update" ON public.products
FOR UPDATE USING (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'supervisor')
);

-- Solo admin puede eliminar productos
CREATE POLICY "products_delete" ON public.products
FOR DELETE USING (
  public.has_role(auth.uid(), 'admin')
);

-- =====================================================
-- INTERACTIONS: Agregar DELETE para vendedores (propio registro)
-- Antes: solo admin podía borrar
-- Ahora: vendedor puede borrar las propias (último recurso)
-- =====================================================
DROP POLICY IF EXISTS "interactions_delete" ON public.interactions;
CREATE POLICY "interactions_delete" ON public.interactions
FOR DELETE USING (
  user_id = auth.uid()
  OR public.has_role(auth.uid(), 'admin')
);

-- =====================================================
-- CLIENTS: Agregar DELETE para supervisor
-- Antes: solo admin podía borrar
-- Ahora: admin y supervisor
-- =====================================================
DROP POLICY IF EXISTS "clients_delete" ON public.clients;
CREATE POLICY "clients_delete" ON public.clients
FOR DELETE USING (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'supervisor')
);

-- =====================================================
-- PROFILES: Agregar DELETE (solo admin, para limpieza)
-- =====================================================
CREATE POLICY "profiles_delete" ON public.profiles
FOR DELETE USING (
  public.has_role(auth.uid(), 'admin')
);
