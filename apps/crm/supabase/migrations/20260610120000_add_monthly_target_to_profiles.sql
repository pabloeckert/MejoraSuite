-- MejoraCRM — Cuota mensual por vendedor
-- Fecha: 2026-06-10
-- Descripción: Agrega campo monthly_target a profiles para gestión de metas
--              individuales de ingresos por vendedor.
--              Nullable: un perfil sin cuota asignada no participa en el cálculo
--              de progreso en el dashboard.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS monthly_target NUMERIC(15, 2) NULL;

COMMENT ON COLUMN public.profiles.monthly_target IS
  'Cuota mensual de ingresos en ARS. NULL = sin cuota asignada. '
  'Solo el admin puede actualizar este campo (RLS existente de admin cubre UPDATE).';
