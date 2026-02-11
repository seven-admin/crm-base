-- =====================================================
-- LIMPEZA COMPLETA DO BANCO DE DADOS
-- Ordem corrigida para respeitar foreign keys
-- =====================================================

-- Tabelas de auditoria
DELETE FROM public.audit_logs;

-- Tabelas de relacionamento de clientes
DELETE FROM public.cliente_interacoes;

-- Tabelas de contrato (dependentes)
DELETE FROM public.contrato_aprovacoes;
DELETE FROM public.contrato_documentos;
DELETE FROM public.contrato_pendencias;
DELETE FROM public.contrato_signatarios;
DELETE FROM public.contrato_versoes;
DELETE FROM public.contrato_unidades;
DELETE FROM public.contrato_condicoes_pagamento;

-- Tabelas de comissão (dependentes)
DELETE FROM public.comissao_parcelas;

-- Tabelas de negociação (dependentes)
DELETE FROM public.negociacao_clientes;
DELETE FROM public.negociacao_unidades;
DELETE FROM public.negociacao_historico;

-- Tabelas de template de contrato
DELETE FROM public.contrato_template_imagens;

-- Tabelas de centro de custo
DELETE FROM public.centro_custo_empreendimentos;

-- Tabelas de empreendimento (relacionamentos)
DELETE FROM public.empreendimento_corretores;
DELETE FROM public.empreendimento_imobiliarias;
DELETE FROM public.empreendimento_documentos;
DELETE FROM public.empreendimento_midias;
DELETE FROM public.user_empreendimentos;

-- Tabelas de eventos
DELETE FROM public.evento_tarefas;
DELETE FROM public.evento_membros;
DELETE FROM public.evento_template_tarefas;

-- Reservas e atividades
DELETE FROM public.reserva_documentos;
DELETE FROM public.atividades;

-- Tabelas principais (contratos, comissões, etc)
DELETE FROM public.contratos;
DELETE FROM public.comissoes;
DELETE FROM public.bonificacoes;

-- Negociações e clientes
DELETE FROM public.negociacoes;
DELETE FROM public.clientes;

-- Unidades, tipologias, blocos
DELETE FROM public.unidades;
DELETE FROM public.tipologias;
DELETE FROM public.blocos;

-- Projetos marketing ANTES de briefings (FK)
DELETE FROM public.tarefas_projeto;
DELETE FROM public.projeto_comentarios;
DELETE FROM public.projeto_historico;
DELETE FROM public.projetos_marketing;

-- Agora briefings
DELETE FROM public.briefings;

-- Eventos
DELETE FROM public.eventos;
DELETE FROM public.evento_templates;

-- Financeiro
DELETE FROM public.saldos_mensais;
DELETE FROM public.lancamentos_financeiros;
DELETE FROM public.plano_contas;

-- Funis e etapas
DELETE FROM public.funil_etapas;
DELETE FROM public.funis;
DELETE FROM public.ticket_etapas;

-- Configurações comerciais
DELETE FROM public.template_condicoes_pagamento;
DELETE FROM public.configuracao_comercial;
DELETE FROM public.configuracao_comissoes;
DELETE FROM public.fluxo_aprovacao_config;

-- Templates de contrato
DELETE FROM public.contrato_templates;

-- Mapa
DELETE FROM public.mapa_empreendimento;

-- Bonus usuário
DELETE FROM public.usuario_empreendimento_bonus;

-- Empreendimentos
DELETE FROM public.empreendimentos;

-- Corretores e imobiliárias
DELETE FROM public.corretores;
DELETE FROM public.imobiliarias;

-- Categorias e centros
DELETE FROM public.categorias_fluxo;
DELETE FROM public.centros_custo;

-- Metas comerciais
DELETE FROM public.metas_comerciais;

-- Webhooks
DELETE FROM public.webhooks;

-- Resetar sequences para começar do 1
ALTER SEQUENCE IF EXISTS briefing_codigo_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS contrato_numero_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS comissao_numero_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS negociacao_codigo_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS negociacao_proposta_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS proposta_numero_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS projeto_codigo_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS evento_codigo_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS reserva_protocolo_seq RESTART WITH 1;