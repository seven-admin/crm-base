-- Adicionar campos de hora opcionais às atividades
ALTER TABLE public.atividades 
ADD COLUMN hora_inicio TIME,
ADD COLUMN hora_fim TIME;

-- Comentários para documentação
COMMENT ON COLUMN public.atividades.hora_inicio IS 'Hora de início da atividade (opcional)';
COMMENT ON COLUMN public.atividades.hora_fim IS 'Hora de fim da atividade (opcional)';