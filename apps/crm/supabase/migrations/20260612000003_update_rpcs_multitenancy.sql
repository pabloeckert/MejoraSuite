-- ==============================================================
-- MejoraCRM — Multitenancy: actualización de RPC functions
-- Las RPCs son SECURITY DEFINER y bypasan RLS, por lo que necesitan
-- filtros explícitos de organization_id.
-- ==============================================================

-- ── get_dashboard_data ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_dashboard_data()
RETURNS JSON
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
  org_id UUID;
BEGIN
  org_id := public.current_org_id();

  SELECT json_build_object(
    'interactions', (
      SELECT COALESCE(json_agg(i.*), '[]'::json)
      FROM (
        SELECT
          i.*,
          row_to_json(c.*) AS client,
          COALESCE(
            (SELECT json_agg(json_build_object(
              'quantity', il.quantity,
              'unit_price', il.unit_price,
              'line_total', il.line_total,
              'product', row_to_json(p.*)
            ))
            FROM public.interaction_lines il
            LEFT JOIN public.products p ON p.id = il.product_id
            WHERE il.interaction_id = i.id),
            '[]'::json
          ) AS interaction_lines
        FROM public.interactions i
        LEFT JOIN public.clients c ON c.id = i.client_id
        WHERE
          i.organization_id = org_id
          AND (
            i.user_id = auth.uid()
            OR public.has_role(auth.uid(), 'admin')
            OR public.has_role(auth.uid(), 'supervisor')
          )
        ORDER BY i.interaction_date DESC
      ) i
    ),
    'clients', (
      SELECT COALESCE(json_agg(c.*), '[]'::json)
      FROM public.clients c
      WHERE
        c.organization_id = org_id
        AND (
          c.assigned_to = auth.uid()
          OR public.has_role(auth.uid(), 'admin')
          OR public.has_role(auth.uid(), 'supervisor')
        )
    ),
    'profiles', (
      SELECT COALESCE(json_agg(json_build_object(
        'user_id', p.user_id,
        'full_name', p.full_name
      )), '[]'::json)
      FROM public.profiles p
      WHERE p.organization_id = org_id
    )
  ) INTO result;

  RETURN result;
END;
$$;

-- ── get_notifications_data ─────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_notifications_data()
RETURNS JSON
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
  org_id UUID;
BEGIN
  org_id := public.current_org_id();

  SELECT json_build_object(
    'interactions', (
      SELECT COALESCE(json_agg(json_build_object(
        'id', i.id,
        'client_id', i.client_id,
        'user_id', i.user_id,
        'interaction_date', i.interaction_date,
        'result', i.result,
        'follow_up_date', i.follow_up_date,
        'next_step', i.next_step,
        'client_name', c.name
      )), '[]'::json)
      FROM public.interactions i
      LEFT JOIN public.clients c ON c.id = i.client_id
      WHERE
        i.organization_id = org_id
        AND (
          i.user_id = auth.uid()
          OR public.has_role(auth.uid(), 'admin')
          OR public.has_role(auth.uid(), 'supervisor')
        )
    ),
    'clients', (
      SELECT COALESCE(json_agg(c.*), '[]'::json)
      FROM public.clients c
      WHERE
        c.organization_id = org_id
        AND (
          c.assigned_to = auth.uid()
          OR public.has_role(auth.uid(), 'admin')
          OR public.has_role(auth.uid(), 'supervisor')
        )
    ),
    'profiles', (
      SELECT COALESCE(json_agg(json_build_object(
        'user_id', p.user_id,
        'full_name', p.full_name
      )), '[]'::json)
      FROM public.profiles p
      WHERE p.organization_id = org_id
    )
  ) INTO result;

  RETURN result;
END;
$$;

-- ── get_seller_ranking ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_seller_ranking(period_start TIMESTAMPTZ)
RETURNS JSON
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  org_id UUID;
BEGIN
  org_id := public.current_org_id();

  RETURN (
    SELECT COALESCE(json_agg(r.*), '[]'::json)
    FROM (
      SELECT
        p.user_id,
        p.full_name,
        COUNT(*) FILTER (WHERE i.result = 'venta')       AS ventas,
        COUNT(*) FILTER (WHERE i.result = 'presupuesto') AS presupuestos,
        COUNT(*) FILTER (WHERE i.result = 'seguimiento') AS seguimientos,
        COALESCE(SUM(i.total_amount) FILTER (WHERE i.result = 'venta'), 0) AS ingresos
      FROM public.profiles p
      LEFT JOIN public.interactions i
        ON i.user_id = p.user_id
        AND i.organization_id = org_id
        AND i.interaction_date >= period_start
      WHERE p.organization_id = org_id
      GROUP BY p.user_id, p.full_name
      HAVING COUNT(i.id) > 0
      ORDER BY COALESCE(SUM(i.total_amount) FILTER (WHERE i.result = 'venta'), 0) DESC
    ) r
  );
END;
$$;
