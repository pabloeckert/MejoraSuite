-- Fix: agregar columnas faltantes si la tabla ya existía
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS country TEXT NOT NULL DEFAULT 'Argentina';
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS province TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS status public.client_status NOT NULL DEFAULT 'potencial';

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS unit TEXT NOT NULL DEFAULT 'u';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS unit_label TEXT NOT NULL DEFAULT 'Unidad';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS currency public.currency_code NOT NULL DEFAULT 'ARS';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS description TEXT;
