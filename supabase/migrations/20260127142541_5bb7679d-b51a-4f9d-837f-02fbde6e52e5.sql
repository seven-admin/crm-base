-- Adicionar coluna para registrar motivo de cancelamento de atividades
ALTER TABLE public.atividades 
ADD COLUMN IF NOT EXISTS motivo_cancelamento TEXT;