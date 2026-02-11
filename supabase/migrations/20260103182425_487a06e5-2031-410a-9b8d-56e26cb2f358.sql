-- Limpar dados de teste das tabelas de contratos e templates

-- Primeiro, limpar dependências de contratos
DELETE FROM contrato_condicoes_pagamento;
DELETE FROM contrato_aprovacoes;
DELETE FROM contrato_documentos;
DELETE FROM contrato_pendencias;
DELETE FROM contrato_signatarios;
DELETE FROM contrato_unidades;
DELETE FROM contrato_versoes;

-- Limpar contratos
DELETE FROM contratos;

-- Limpar dependências de templates
DELETE FROM template_condicoes_pagamento;
DELETE FROM contrato_template_imagens;

-- Limpar templates
DELETE FROM contrato_templates;

-- Adicionar variáveis de unidade faltantes
INSERT INTO contrato_variaveis (chave, label, categoria, origem, campo_origem, is_sistema, is_active, exemplo, tipo)
VALUES 
  ('tipologia', 'Nome da Tipologia', 'unidade', 'tipologias', 'nome', true, true, 'Apartamento 2 Quartos', 'texto'),
  ('descricao_unidade', 'Descrição da Unidade', 'unidade', 'tipologias', 'descricao', true, true, 'Apartamento com 2 quartos, sala ampla e varanda', 'texto'),
  ('area_unidade', 'Área Total da Unidade (m²)', 'unidade', 'unidades', 'area_total', true, true, '65.50', 'numero')
ON CONFLICT (chave) DO NOTHING;