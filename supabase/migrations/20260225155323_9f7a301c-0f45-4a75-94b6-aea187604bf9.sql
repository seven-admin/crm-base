
ALTER TABLE public.negociacoes 
  ADD COLUMN IF NOT EXISTS motivo_contra_proposta text,
  ADD COLUMN IF NOT EXISTS aprovada_incorporador_em timestamptz,
  ADD COLUMN IF NOT EXISTS aprovada_incorporador_por uuid;
