-- Block 9: Add image reference URL column to briefings
ALTER TABLE public.briefings
ADD COLUMN IF NOT EXISTS referencia_imagem_url TEXT DEFAULT NULL;