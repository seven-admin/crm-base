-- Adicionar campo categoria para segmentar primeiro atendimento e retorno
ALTER TABLE public.atividades 
ADD COLUMN categoria TEXT DEFAULT 'primeiro_atendimento';

-- Comentário explicativo
COMMENT ON COLUMN public.atividades.categoria IS 'Categoria da atividade: primeiro_atendimento ou retorno';