
-- ============================================================
-- FASE 1: Rename tables to seven_* and sistema_*
-- ============================================================

-- Seven domain (25 tables)
ALTER TABLE public.empreendimentos RENAME TO seven_empreendimentos;
ALTER TABLE public.blocos RENAME TO seven_blocos;
ALTER TABLE public.unidades RENAME TO seven_unidades;
ALTER TABLE public.tipologias RENAME TO seven_tipologias;
ALTER TABLE public.boxes RENAME TO seven_boxes;
ALTER TABLE public.fachadas RENAME TO seven_fachadas;
ALTER TABLE public.mapa_empreendimento RENAME TO seven_mapa_empreendimento;
ALTER TABLE public.empreendimento_documentos RENAME TO seven_empreendimento_documentos;
ALTER TABLE public.empreendimento_midias RENAME TO seven_empreendimento_midias;
ALTER TABLE public.empreendimento_corretores RENAME TO seven_empreendimento_corretores;
ALTER TABLE public.empreendimento_imobiliarias RENAME TO seven_empreendimento_imobiliarias;
ALTER TABLE public.clientes RENAME TO seven_clientes;
ALTER TABLE public.cliente_telefones RENAME TO seven_cliente_telefones;
ALTER TABLE public.cliente_socios RENAME TO seven_cliente_socios;
ALTER TABLE public.cliente_interacoes RENAME TO seven_cliente_interacoes;
ALTER TABLE public.corretores RENAME TO seven_corretores;
ALTER TABLE public.imobiliarias RENAME TO seven_imobiliarias;
ALTER TABLE public.incorporadoras RENAME TO seven_incorporadoras;
ALTER TABLE public.unidade_historico_precos RENAME TO seven_unidade_historico_precos;
ALTER TABLE public.centros_custo RENAME TO seven_centros_custo;
ALTER TABLE public.centro_custo_empreendimentos RENAME TO seven_centro_custo_empreendimentos;
ALTER TABLE public.plano_contas RENAME TO seven_plano_contas;
ALTER TABLE public.lancamentos_financeiros RENAME TO seven_lancamentos_financeiros;
ALTER TABLE public.saldos_mensais RENAME TO seven_saldos_mensais;
ALTER TABLE public.configuracao_comercial RENAME TO seven_configuracao_comercial;

-- Sistema (infra, 7 tables)
ALTER TABLE public.modules RENAME TO sistema_modules;
ALTER TABLE public.role_permissions RENAME TO sistema_role_permissions;
ALTER TABLE public.user_module_permissions RENAME TO sistema_user_module_permissions;
ALTER TABLE public.user_empreendimentos RENAME TO sistema_user_empreendimentos;
ALTER TABLE public.audit_logs RENAME TO sistema_audit_logs;
ALTER TABLE public.notificacoes RENAME TO sistema_notificacoes;
ALTER TABLE public.configuracoes_sistema RENAME TO sistema_configuracoes;

-- ============================================================
-- FASE 2: Compatibility views (old names -> new tables)
-- Simple "SELECT *" views são automaticamente atualizáveis em PG.
-- Herdam RLS das tabelas base (SECURITY INVOKER é o padrão em PG 15+).
-- ============================================================

CREATE VIEW public.empreendimentos AS SELECT * FROM public.seven_empreendimentos;
CREATE VIEW public.blocos AS SELECT * FROM public.seven_blocos;
CREATE VIEW public.unidades AS SELECT * FROM public.seven_unidades;
CREATE VIEW public.tipologias AS SELECT * FROM public.seven_tipologias;
CREATE VIEW public.boxes AS SELECT * FROM public.seven_boxes;
CREATE VIEW public.fachadas AS SELECT * FROM public.seven_fachadas;
CREATE VIEW public.mapa_empreendimento AS SELECT * FROM public.seven_mapa_empreendimento;
CREATE VIEW public.empreendimento_documentos AS SELECT * FROM public.seven_empreendimento_documentos;
CREATE VIEW public.empreendimento_midias AS SELECT * FROM public.seven_empreendimento_midias;
CREATE VIEW public.empreendimento_corretores AS SELECT * FROM public.seven_empreendimento_corretores;
CREATE VIEW public.empreendimento_imobiliarias AS SELECT * FROM public.seven_empreendimento_imobiliarias;
CREATE VIEW public.clientes AS SELECT * FROM public.seven_clientes;
CREATE VIEW public.cliente_telefones AS SELECT * FROM public.seven_cliente_telefones;
CREATE VIEW public.cliente_socios AS SELECT * FROM public.seven_cliente_socios;
CREATE VIEW public.cliente_interacoes AS SELECT * FROM public.seven_cliente_interacoes;
CREATE VIEW public.corretores AS SELECT * FROM public.seven_corretores;
CREATE VIEW public.imobiliarias AS SELECT * FROM public.seven_imobiliarias;
CREATE VIEW public.incorporadoras AS SELECT * FROM public.seven_incorporadoras;
CREATE VIEW public.unidade_historico_precos AS SELECT * FROM public.seven_unidade_historico_precos;
CREATE VIEW public.centros_custo AS SELECT * FROM public.seven_centros_custo;
CREATE VIEW public.centro_custo_empreendimentos AS SELECT * FROM public.seven_centro_custo_empreendimentos;
CREATE VIEW public.plano_contas AS SELECT * FROM public.seven_plano_contas;
CREATE VIEW public.lancamentos_financeiros AS SELECT * FROM public.seven_lancamentos_financeiros;
CREATE VIEW public.saldos_mensais AS SELECT * FROM public.seven_saldos_mensais;
CREATE VIEW public.configuracao_comercial AS SELECT * FROM public.seven_configuracao_comercial;

CREATE VIEW public.modules AS SELECT * FROM public.sistema_modules;
CREATE VIEW public.role_permissions AS SELECT * FROM public.sistema_role_permissions;
CREATE VIEW public.user_module_permissions AS SELECT * FROM public.sistema_user_module_permissions;
CREATE VIEW public.user_empreendimentos AS SELECT * FROM public.sistema_user_empreendimentos;
CREATE VIEW public.audit_logs AS SELECT * FROM public.sistema_audit_logs;
CREATE VIEW public.notificacoes AS SELECT * FROM public.sistema_notificacoes;
CREATE VIEW public.configuracoes_sistema AS SELECT * FROM public.sistema_configuracoes;

-- ============================================================
-- FASE 3: Grants nas views (equivalentes aos das tabelas originais)
-- RLS continua sendo aplicada na tabela base via SECURITY INVOKER.
-- ============================================================

DO $$
DECLARE
  v text;
  view_names text[] := ARRAY[
    'empreendimentos','blocos','unidades','tipologias','boxes','fachadas',
    'mapa_empreendimento','empreendimento_documentos','empreendimento_midias',
    'empreendimento_corretores','empreendimento_imobiliarias',
    'clientes','cliente_telefones','cliente_socios','cliente_interacoes',
    'corretores','imobiliarias','incorporadoras','unidade_historico_precos',
    'centros_custo','centro_custo_empreendimentos','plano_contas',
    'lancamentos_financeiros','saldos_mensais','configuracao_comercial',
    'modules','role_permissions','user_module_permissions',
    'user_empreendimentos','audit_logs','notificacoes','configuracoes_sistema'
  ];
BEGIN
  FOREACH v IN ARRAY view_names LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', v);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', v);
    EXECUTE format('GRANT SELECT ON public.%I TO anon', v);
  END LOOP;
END $$;
