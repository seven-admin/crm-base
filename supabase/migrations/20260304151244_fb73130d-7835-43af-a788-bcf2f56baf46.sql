
ALTER TABLE atividades ADD COLUMN qtd_participantes integer;

UPDATE atividades
SET qtd_participantes = (regexp_match(observacoes, 'PARA\s+(\d+)\s+CORRETOR'))[1]::integer
WHERE tipo = 'treinamento'
  AND observacoes ~ 'PARA\s+\d+\s+CORRETOR';
