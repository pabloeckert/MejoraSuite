-- =====================================================
-- MejoraCRM — Índices de performance
-- Fecha: 2026-04-23
-- Descripción: Agrega índices faltantes para las queries
--              más frecuentes del frontend
-- =====================================================

-- Clients: búsquedas por vendedor asignado
CREATE INDEX IF NOT EXISTS idx_clients_assigned_to
  ON public.clients(assigned_to);

-- Clients: filtrado por estado (activo/potencial/inactivo)
CREATE INDEX IF NOT EXISTS idx_clients_status
  ON public.clients(status);

-- Clients: ordenamiento y búsqueda por nombre
CREATE INDEX IF NOT EXISTS idx_clients_name
  ON public.clients(name);

-- Interactions: seguimientos programados (follow_up_date)
-- Usado por Dashboard, NotificationsPanel para alertas vencidas
CREATE INDEX IF NOT EXISTS idx_interactions_follow_up_date
  ON public.interactions(follow_up_date)
  WHERE follow_up_date IS NOT NULL;

-- Interactions: filtro compuesto cliente + resultado
-- Usado por Interactions.tsx para buscar presupuestos de un cliente
CREATE INDEX IF NOT EXISTS idx_interactions_client_result
  ON public.interactions(client_id, result);
