-- 1. Adicionar novas colunas de data (apenas DATE, sem hora)
ALTER TABLE atividades ADD COLUMN data_inicio DATE;
ALTER TABLE atividades ADD COLUMN data_fim DATE;

-- 2. Migrar dados existentes:
--    data_hora existente vira data_fim (conforme solicitado)
--    data_inicio = data_fim para registros existentes
UPDATE atividades 
SET 
  data_fim = (data_hora AT TIME ZONE 'America/Sao_Paulo')::date,
  data_inicio = (data_hora AT TIME ZONE 'America/Sao_Paulo')::date;

-- 3. Tornar campos NOT NULL após migração
ALTER TABLE atividades ALTER COLUMN data_inicio SET NOT NULL;
ALTER TABLE atividades ALTER COLUMN data_fim SET NOT NULL;

-- 4. Adicionar constraint para garantir início <= fim
ALTER TABLE atividades 
ADD CONSTRAINT chk_atividade_datas CHECK (data_inicio <= data_fim);

-- 5. Remover coluna antiga data_hora
ALTER TABLE atividades DROP COLUMN data_hora;

-- 6. Remover coluna duracao_minutos (obsoleta sem conceito de hora)
ALTER TABLE atividades DROP COLUMN duracao_minutos;