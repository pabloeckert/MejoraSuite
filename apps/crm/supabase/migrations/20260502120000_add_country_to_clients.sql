-- =====================================================
-- MejoraCRM — Agregar campo country a clients
-- Fecha: 2026-05-02
-- Descripción: Campo País para segmentación geográfica.
--              Default 'Argentina' para datos existentes.
-- =====================================================

ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS country TEXT NOT NULL DEFAULT 'Argentina';

-- Índice para filtros por país
CREATE INDEX IF NOT EXISTS idx_clients_country
  ON public.clients(country);

COMMENT ON COLUMN public.clients.country IS 'País del cliente. Default Argentina.';
