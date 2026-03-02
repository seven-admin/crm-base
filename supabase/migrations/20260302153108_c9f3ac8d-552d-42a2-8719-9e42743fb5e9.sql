
-- Remover indice com expressao (incompativel com upsert PostgREST)
DROP INDEX IF EXISTS metas_comerciais_unique_comp_emp_cor_ges_per;

-- Remover constraint legada incompleta
ALTER TABLE metas_comerciais DROP CONSTRAINT IF EXISTS metas_comerciais_unique_key;
