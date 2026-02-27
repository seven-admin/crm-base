
-- Adicionar colunas de cronômetro na tabela atividades
ALTER TABLE public.atividades 
  ADD COLUMN cronometro_inicio timestamptz NULL,
  ADD COLUMN cronometro_fim timestamptz NULL,
  ADD COLUMN duracao_minutos integer NULL;
