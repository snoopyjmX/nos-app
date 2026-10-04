-- Migration: Add thumb_path column to memories table
-- nós. app - Digital private space for couples

ALTER TABLE public.memories
ADD COLUMN IF NOT EXISTS thumb_path text;

COMMENT ON COLUMN public.memories.thumb_path IS 'Caminho do thumbnail (~400px) no bucket memories do Storage. Quando NULL, o app usa image_url como fallback transparente.';
