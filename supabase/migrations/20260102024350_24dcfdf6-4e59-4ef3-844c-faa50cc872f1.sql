-- =============================================
-- Limpar banco de dados
-- Dropar tabelas de Estudo de Mercado e Leads
-- =============================================

-- Dropar tabelas de Estudo de Mercado (ordem correta para foreign keys)
DROP TABLE IF EXISTS estudo_metricas CASCADE;
DROP TABLE IF EXISTS estudo_concorrentes CASCADE;
DROP TABLE IF EXISTS estudos_mercado CASCADE;

-- Dropar tabelas de Leads (dados já migrados para clientes)
DROP TABLE IF EXISTS lead_interactions CASCADE;
DROP TABLE IF EXISTS leads CASCADE;