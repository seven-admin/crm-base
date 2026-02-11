-- Remover tabelas de propostas (não usadas no sistema)
DROP TABLE IF EXISTS proposta_simulacao CASCADE;
DROP TABLE IF EXISTS proposta_unidades CASCADE;
DROP TABLE IF EXISTS proposta_clientes CASCADE;
DROP TABLE IF EXISTS propostas CASCADE;

-- Remover coluna proposta_id de tabelas relacionadas
ALTER TABLE comissoes DROP COLUMN IF EXISTS proposta_id;
ALTER TABLE contratos DROP COLUMN IF EXISTS proposta_id;