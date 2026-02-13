
-- Adicionar coluna gestor_id à tabela metas_comerciais
ALTER TABLE public.metas_comerciais 
ADD COLUMN IF NOT EXISTS gestor_id UUID REFERENCES public.profiles(id);

-- Dropar constraint unique antiga e criar nova incluindo gestor_id
ALTER TABLE public.metas_comerciais 
DROP CONSTRAINT IF EXISTS metas_comerciais_competencia_empreendimento_id_corretor_id_key;

ALTER TABLE public.metas_comerciais 
DROP CONSTRAINT IF EXISTS metas_comerciais_unique_competencia;

CREATE UNIQUE INDEX IF NOT EXISTS metas_comerciais_unique_comp_emp_cor_ges_per 
ON public.metas_comerciais (competencia, COALESCE(empreendimento_id, '00000000-0000-0000-0000-000000000000'), COALESCE(corretor_id, '00000000-0000-0000-0000-000000000000'), COALESCE(gestor_id, '00000000-0000-0000-0000-000000000000'), periodicidade);
