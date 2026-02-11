-- Corrigir mismatch entre formulário e tabela: adicionar coluna endereco_complemento
ALTER TABLE public.incorporadoras
  ADD COLUMN IF NOT EXISTS endereco_complemento TEXT;