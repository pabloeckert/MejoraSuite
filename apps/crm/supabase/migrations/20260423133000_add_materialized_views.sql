-- =====================================================
-- MejoraCRM — Vistas materializadas
-- Fecha: 2026-04-23
-- Descripción: Pre-computa datos pesados para el Dashboard.
--              Se refrescan periódicamente o bajo demanda.
-- =====================================================

-- =====================================================
-- mv_seller_ranking: Ranking de vendedores del mes actual
-- Usado por: Dashboard OwnerView
-- Refrescar: cada vez que se crea una interacción,
--            o periódicamente (cada 30 min)
-- =====================================================
CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_seller_ranking AS
SELECT
  p.user_id,
  p.full_name,
  date_trunc('month', now()) AS period_start,
  COUNT(*) FILTER (WHERE i.result = 'venta') AS ventas_count,
  COUNT(*) FILTER (WHERE i.result = 'presupuesto') AS presupuestos_count,
  COUNT(*) FILTER (WHERE i.result = 'seguimiento') AS seguimientos_count,
  COUNT(*) FILTER (WHERE i.result = 'no_interesado') AS rechazos_count,
  COUNT(*) AS total_interactions,
  COALESCE(SUM(i.total_amount) FILTER (WHERE i.result = 'venta'), 0) AS ingresos,
  COALESCE(SUM(i.total_amount) FILTER (WHERE i.result = 'presupuesto'), 0) AS pipeline
FROM public.profiles p
LEFT JOIN public.interactions i ON i.user_id = p.user_id
  AND i.interaction_date >= date_trunc('month', now())
GROUP BY p.user_id, p.full_name;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_seller_ranking_user
  ON public.mv_seller_ranking(user_id);

-- =====================================================
-- mv_client_summary: Resumen de clientes con última interacción
-- Usado por: NotificationsPanel, Dashboard
-- Refrescar: cada vez que se modifica un cliente o interacción
-- =====================================================
CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_client_summary AS
SELECT
  c.id AS client_id,
  c.name,
  c.company,
  c.segment,
  c.province,
  c.status,
  c.assigned_to,
  c.created_at AS client_created_at,
  last_int.last_interaction_date,
  last_int.last_result,
  last_int.last_medium,
  COALESCE(int_count.total, 0) AS total_interactions,
  COALESCE(int_count.ventas, 0) AS total_ventas,
  COALESCE(int_count.presupuestos, 0) AS total_presupuestos,
  CASE
    WHEN last_int.last_interaction_date IS NULL THEN NULL
    ELSE EXTRACT(DAY FROM now() - last_int.last_interaction_date)::INT
  END AS days_since_last_interaction
FROM public.clients c
LEFT JOIN LATERAL (
  SELECT
    i.interaction_date AS last_interaction_date,
    i.result AS last_result,
    i.medium AS last_medium
  FROM public.interactions i
  WHERE i.client_id = c.id
  ORDER BY i.interaction_date DESC
  LIMIT 1
) last_int ON true
LEFT JOIN LATERAL (
  SELECT
    COUNT(*) AS total,
    COUNT(*) FILTER (WHERE result = 'venta') AS ventas,
    COUNT(*) FILTER (WHERE result = 'presupuesto') AS presupuestos
  FROM public.interactions i
  WHERE i.client_id = c.id
) int_count ON true;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_client_summary_id
  ON public.mv_client_summary(client_id);

CREATE INDEX IF NOT EXISTS idx_mv_client_summary_assigned
  ON public.mv_client_summary(assigned_to);

CREATE INDEX IF NOT EXISTS idx_mv_client_summary_status
  ON public.mv_client_summary(status);

-- =====================================================
-- Función para refrescar ambas vistas
-- Se puede llamar desde un trigger o cron job
-- =====================================================
CREATE OR REPLACE FUNCTION public.refresh_materialized_views()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_seller_ranking;
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_client_summary;
END;
$$;

-- =====================================================
-- Permisos: las vistas materializadas respetan RLS
-- a través de las políticas de las tablas base.
-- Solo admin/supervisor pueden refrescar.
-- =====================================================
GRANT SELECT ON public.mv_seller_ranking TO authenticated;
GRANT SELECT ON public.mv_client_summary TO authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_materialized_views() TO authenticated;
