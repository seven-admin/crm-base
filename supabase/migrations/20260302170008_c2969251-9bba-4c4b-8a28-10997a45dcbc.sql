-- 1. Adicionar coluna meta_ligacoes na tabela metas_comerciais
ALTER TABLE public.metas_comerciais 
  ADD COLUMN meta_ligacoes integer NOT NULL DEFAULT 0;

-- 2. Alterar FK negociacoes_atividade_origem_id_fkey para ON DELETE SET NULL
ALTER TABLE public.negociacoes 
  DROP CONSTRAINT negociacoes_atividade_origem_id_fkey,
  ADD CONSTRAINT negociacoes_atividade_origem_id_fkey 
    FOREIGN KEY (atividade_origem_id) 
    REFERENCES public.atividades(id) 
    ON DELETE SET NULL;