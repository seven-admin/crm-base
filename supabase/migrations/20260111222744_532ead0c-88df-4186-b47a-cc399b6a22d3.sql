
-- =============================================
-- LIMPEZA DO BANCO DE DADOS PARA PRODUÇÃO
-- Baseado nas tabelas que realmente existem
-- =============================================

-- 1. LIMPAR LOGS
TRUNCATE TABLE audit_logs;

-- 2. LIMPAR COMISSÕES
DELETE FROM comissao_parcelas;
DELETE FROM comissoes;

-- 3. QUEBRAR REFERÊNCIAS CIRCULARES
UPDATE contratos SET negociacao_id = NULL;
UPDATE negociacoes SET contrato_id = NULL;

-- 4. LIMPAR CONTRATOS (filhos primeiro)
DELETE FROM contrato_signatarios;
DELETE FROM contrato_versoes;
DELETE FROM contrato_pendencias;
DELETE FROM contrato_documentos;
DELETE FROM contrato_aprovacoes;
DELETE FROM contrato_condicoes_pagamento;
DELETE FROM contrato_unidades;
DELETE FROM contratos;

-- 5. LIMPAR NEGOCIAÇÕES (filhos primeiro)
DELETE FROM negociacao_historico;
DELETE FROM negociacao_condicoes_pagamento;
DELETE FROM negociacao_clientes;
DELETE FROM negociacao_unidades;
DELETE FROM negociacoes;

-- 6. LIMPAR ATIVIDADES (antes de clientes)
DELETE FROM atividades;

-- 7. LIMPAR CLIENTES (filhos primeiro)
DELETE FROM cliente_interacoes;
DELETE FROM cliente_telefones;
DELETE FROM clientes;

-- 8. LIMPAR RESERVAS
DELETE FROM reserva_documentos;

-- 9. LIMPAR MARKETING (filhos primeiro)
DELETE FROM projeto_historico;
DELETE FROM projeto_comentarios;
DELETE FROM tarefas_projeto;
DELETE FROM projetos_marketing;
DELETE FROM briefings;

-- 10. LIMPAR EVENTOS (filhos primeiro)
DELETE FROM evento_tarefas;
DELETE FROM evento_membros;
DELETE FROM eventos;

-- 11. LIMPAR FINANCEIRO
DELETE FROM lancamentos_financeiros;
DELETE FROM saldos_mensais;
DELETE FROM centro_custo_empreendimentos;

-- 12. LIMPAR METAS E BONIFICAÇÕES
DELETE FROM usuario_empreendimento_bonus;
DELETE FROM bonificacoes;
DELETE FROM metas_comerciais;

-- 13. LIMPAR WEBHOOKS
DELETE FROM webhooks;

-- 14. LIMPAR EMPREENDIMENTOS (filhos primeiro)
DELETE FROM unidade_historico_precos;
DELETE FROM unidades;
DELETE FROM tipologias;
DELETE FROM blocos;
DELETE FROM mapa_empreendimento;
DELETE FROM empreendimento_documentos;
DELETE FROM empreendimento_midias;
DELETE FROM empreendimento_corretores;
DELETE FROM empreendimento_imobiliarias;
DELETE FROM configuracao_comercial;
DELETE FROM configuracao_comissoes;
DELETE FROM user_empreendimentos;
DELETE FROM empreendimentos;

-- 15. LIMPAR MERCADO
DELETE FROM corretores;
DELETE FROM imobiliarias;

-- 16. LIMPAR DADOS DE USUÁRIOS DE TESTE (manter apenas o admin)
DELETE FROM termos_aceites WHERE user_id != '6e46fe54-59ae-4f1c-96f9-c48bb930d444';
DELETE FROM user_module_permissions WHERE user_id != '6e46fe54-59ae-4f1c-96f9-c48bb930d444';
DELETE FROM user_roles WHERE user_id != '6e46fe54-59ae-4f1c-96f9-c48bb930d444';
DELETE FROM profiles WHERE id != '6e46fe54-59ae-4f1c-96f9-c48bb930d444';
