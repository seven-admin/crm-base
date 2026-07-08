
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
    EXECUTE format('DROP VIEW IF EXISTS public.%I CASCADE', v);
  END LOOP;
END $$;
