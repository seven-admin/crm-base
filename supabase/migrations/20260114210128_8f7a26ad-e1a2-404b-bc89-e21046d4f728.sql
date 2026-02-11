-- Adicionar campo de aprovação automática nas categorias de fluxo
ALTER TABLE public.categorias_fluxo
ADD COLUMN IF NOT EXISTS aprovacao_automatica BOOLEAN DEFAULT false;

COMMENT ON COLUMN categorias_fluxo.aprovacao_automatica IS 'Se true, lançamentos desta categoria são aprovados automaticamente';