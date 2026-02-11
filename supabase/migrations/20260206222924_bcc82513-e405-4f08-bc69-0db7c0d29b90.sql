-- Bloco 1: Adicionar novas metas comerciais
ALTER TABLE public.metas_comerciais 
  ADD COLUMN IF NOT EXISTS meta_visitas integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS meta_atendimentos integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS meta_treinamentos integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS meta_propostas integer NOT NULL DEFAULT 0;