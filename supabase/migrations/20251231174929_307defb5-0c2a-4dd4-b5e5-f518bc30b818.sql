-- ================================================
-- LIMPEZA COMPLETA DO BANCO DE DADOS
-- Preserva: profiles, user_roles, user_module_permissions, 
--           user_empreendimentos, modules, role_permissions
-- ================================================

SET session_replication_role = 'replica';

-- Limpar tabelas de contratos
DELETE FROM public.contrato_signatarios;
DELETE FROM public.contrato_documentos;
DELETE FROM public.contrato_pendencias;
DELETE FROM public.contrato_aprovacoes;
DELETE FROM public.contrato_versoes;
DELETE FROM public.contrato_unidades;
DELETE FROM public.contrato_template_imagens;
DELETE FROM public.contratos;
DELETE FROM public.contrato_templates;
DELETE FROM public.contrato_variaveis WHERE is_sistema = false;
DELETE FROM public.fluxo_aprovacao_config;

-- Limpar tabelas de comissões
DELETE FROM public.comissao_parcelas;
DELETE FROM public.comissoes;
DELETE FROM public.configuracao_comissoes;

-- Limpar tabelas de propostas
DELETE FROM public.proposta_clientes;
DELETE FROM public.proposta_simulacao;
DELETE FROM public.proposta_unidades;
DELETE FROM public.propostas;

-- Limpar tabelas de negociações
DELETE FROM public.negociacao_historico;
DELETE FROM public.negociacao_unidades;
DELETE FROM public.negociacoes;
DELETE FROM public.funil_etapas;
DELETE FROM public.funis;

-- Limpar tabelas de leads e clientes
DELETE FROM public.lead_interactions;
DELETE FROM public.leads;
DELETE FROM public.clientes;

-- Limpar tabelas de corretores e imobiliárias
DELETE FROM public.empreendimento_corretores;
DELETE FROM public.empreendimento_imobiliarias;
DELETE FROM public.corretores;
DELETE FROM public.imobiliarias;

-- Limpar tabelas de empreendimentos
DELETE FROM public.reserva_documentos;
DELETE FROM public.reservas_temporarias;
DELETE FROM public.unidades;
DELETE FROM public.tipologias;
DELETE FROM public.blocos;
DELETE FROM public.configuracao_comercial;
DELETE FROM public.empreendimento_documentos;
DELETE FROM public.empreendimento_midias;
DELETE FROM public.mapa_empreendimento;
DELETE FROM public.empreendimentos;

-- Limpar tabelas de marketing/projetos
DELETE FROM public.projeto_comentarios;
DELETE FROM public.tarefas_projeto;
DELETE FROM public.projeto_historico;
DELETE FROM public.projetos_marketing;

-- Limpar tabelas de eventos
DELETE FROM public.evento_tarefas;
DELETE FROM public.evento_membros;
DELETE FROM public.eventos;

-- Limpar tabelas de briefings
DELETE FROM public.briefings;

-- Limpar tabelas de estudos de mercado
DELETE FROM public.estudo_concorrentes;
DELETE FROM public.estudo_metricas;
DELETE FROM public.estudos_mercado;

-- Limpar audit logs
DELETE FROM public.audit_logs;

SET session_replication_role = 'origin';

-- Resetar sequences
ALTER SEQUENCE IF EXISTS briefing_codigo_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS projeto_codigo_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS evento_codigo_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS proposta_numero_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS contrato_numero_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS comissao_numero_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS negociacao_codigo_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS reserva_protocolo_seq RESTART WITH 1;

-- ================================================
-- ADICIONAR CAMPO DESCRIÇÃO NA TABELA UNIDADES
-- ================================================
ALTER TABLE public.unidades ADD COLUMN IF NOT EXISTS descricao TEXT;