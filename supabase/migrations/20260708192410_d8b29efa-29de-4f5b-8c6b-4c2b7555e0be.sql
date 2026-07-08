
-- =========================================================
-- FASE 0.1 — REMOÇÃO COMPLETA DO MÓDULO COMERCIAL
-- =========================================================

-- ---------- Contratos ----------
DROP TABLE IF EXISTS public.contrato_aprovacoes CASCADE;
DROP TABLE IF EXISTS public.contrato_pendencias CASCADE;
DROP TABLE IF EXISTS public.contrato_documentos CASCADE;
DROP TABLE IF EXISTS public.contrato_signatarios CASCADE;
DROP TABLE IF EXISTS public.contrato_condicoes_pagamento CASCADE;
DROP TABLE IF EXISTS public.contrato_unidades CASCADE;
DROP TABLE IF EXISTS public.contrato_versoes CASCADE;
DROP TABLE IF EXISTS public.contrato_template_imagens CASCADE;
DROP TABLE IF EXISTS public.contrato_templates CASCADE;
DROP TABLE IF EXISTS public.contrato_variaveis CASCADE;
DROP TABLE IF EXISTS public.contratos CASCADE;

-- ---------- Comissões / Bonificações ----------
DROP TABLE IF EXISTS public.comissao_parcelas CASCADE;
DROP TABLE IF EXISTS public.comissoes CASCADE;
DROP TABLE IF EXISTS public.configuracao_comissoes CASCADE;
DROP TABLE IF EXISTS public.usuario_empreendimento_bonus CASCADE;
DROP TABLE IF EXISTS public.bonificacoes CASCADE;

-- ---------- Propostas ----------
DROP TABLE IF EXISTS public.proposta_condicoes_pagamento CASCADE;
DROP TABLE IF EXISTS public.proposta_unidades CASCADE;
DROP TABLE IF EXISTS public.propostas CASCADE;
DROP TABLE IF EXISTS public.template_condicoes_pagamento CASCADE;

-- ---------- Negociações ----------
DROP TABLE IF EXISTS public.negociacao_dacao_anexos CASCADE;
DROP TABLE IF EXISTS public.negociacao_historico CASCADE;
DROP TABLE IF EXISTS public.negociacao_comentarios CASCADE;
DROP TABLE IF EXISTS public.negociacao_condicoes_pagamento CASCADE;
DROP TABLE IF EXISTS public.negociacao_unidades CASCADE;
DROP TABLE IF EXISTS public.negociacao_clientes CASCADE;
DROP TABLE IF EXISTS public.negociacoes CASCADE;

-- ---------- Atividades ----------
DROP TABLE IF EXISTS public.atividade_responsaveis CASCADE;
DROP TABLE IF EXISTS public.atividade_historico CASCADE;
DROP TABLE IF EXISTS public.atividade_comentarios CASCADE;
DROP TABLE IF EXISTS public.atividade_etapas CASCADE;
DROP TABLE IF EXISTS public.atividades CASCADE;

-- ---------- Funis / Metas / Configs comerciais ----------
DROP TABLE IF EXISTS public.funil_etapas CASCADE;
DROP TABLE IF EXISTS public.funis CASCADE;
DROP TABLE IF EXISTS public.metas_comerciais CASCADE;
DROP TABLE IF EXISTS public.tipos_atendimento_config CASCADE;
DROP TABLE IF EXISTS public.categorias_fluxo CASCADE;
DROP TABLE IF EXISTS public.fluxo_aprovacao_config CASCADE;
DROP TABLE IF EXISTS public.modalidade_componentes CASCADE;
DROP TABLE IF EXISTS public.modalidades_pagamento CASCADE;
DROP TABLE IF EXISTS public.tipos_parcela CASCADE;

-- ---------- Reservas ----------
DROP TABLE IF EXISTS public.reserva_documentos CASCADE;

-- ---------- Webhooks / Termos ----------
DROP TABLE IF EXISTS public.webhook_logs CASCADE;
DROP TABLE IF EXISTS public.webhook_variaveis_disponiveis CASCADE;
DROP TABLE IF EXISTS public.webhooks CASCADE;
DROP TABLE IF EXISTS public.termos_aceites CASCADE;
DROP TABLE IF EXISTS public.termos_versoes CASCADE;

-- ---------- Sequences ----------
DROP SEQUENCE IF EXISTS public.negociacao_codigo_seq CASCADE;
DROP SEQUENCE IF EXISTS public.negociacao_proposta_seq CASCADE;
DROP SEQUENCE IF EXISTS public.proposta_numero_seq CASCADE;
DROP SEQUENCE IF EXISTS public.contrato_numero_seq CASCADE;
DROP SEQUENCE IF EXISTS public.comissao_numero_seq CASCADE;
DROP SEQUENCE IF EXISTS public.reserva_protocolo_seq CASCADE;

-- ---------- Funções específicas do comercial ----------
DROP FUNCTION IF EXISTS public.aprovar_solicitacao_negociacao(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.rejeitar_solicitacao_negociacao(uuid, text, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.liberar_unidades_negociacao_cancelada() CASCADE;
DROP FUNCTION IF EXISTS public.can_view_negociacao_condicoes(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.verificar_ficha_proposta_completa(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.atualizar_ficha_completa() CASCADE;
DROP FUNCTION IF EXISTS public.check_negociacao_proposta_expiracao() CASCADE;
DROP FUNCTION IF EXISTS public.check_proposta_expiracao() CASCADE;
DROP FUNCTION IF EXISTS public.manage_negociacao_proposta_unidades_status() CASCADE;
DROP FUNCTION IF EXISTS public.manage_proposta_unidades_status() CASCADE;
DROP FUNCTION IF EXISTS public.generate_negociacao_codigo() CASCADE;
DROP FUNCTION IF EXISTS public.generate_negociacao_proposta_numero() CASCADE;
DROP FUNCTION IF EXISTS public.generate_proposta_numero() CASCADE;
DROP FUNCTION IF EXISTS public.generate_contrato_numero() CASCADE;
DROP FUNCTION IF EXISTS public.generate_comissao_numero() CASCADE;
DROP FUNCTION IF EXISTS public.generate_reserva_protocolo() CASCADE;
DROP FUNCTION IF EXISTS public.generate_signature_token() CASCADE;
DROP FUNCTION IF EXISTS public.gerar_hash_versao(text) CASCADE;
DROP FUNCTION IF EXISTS public.log_atividade_criacao() CASCADE;
DROP FUNCTION IF EXISTS public.log_atividade_alteracao() CASCADE;
DROP FUNCTION IF EXISTS public.set_atividade_created_by() CASCADE;
DROP FUNCTION IF EXISTS public.auto_set_gestor_id_atividades() CASCADE;
DROP FUNCTION IF EXISTS public.set_data_venda() CASCADE;
DROP FUNCTION IF EXISTS public.get_all_sequence_values() CASCADE;
DROP FUNCTION IF EXISTS public.reset_sequence_value(text, bigint) CASCADE;
