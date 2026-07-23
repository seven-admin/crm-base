-- Corrige a liberação após "sem resposta" e permite até quatro telefones
-- adicionais específicos por lead.

ALTER TABLE public.arqo_leads
  ADD COLUMN IF NOT EXISTS telefones_adicionais text[] NOT NULL DEFAULT '{}'::text[];

ALTER TABLE public.arqo_leads
  DROP CONSTRAINT IF EXISTS arqo_leads_telefones_adicionais_limite;

ALTER TABLE public.arqo_leads
  ADD CONSTRAINT arqo_leads_telefones_adicionais_limite
  CHECK (cardinality(telefones_adicionais) <= 4);

CREATE OR REPLACE FUNCTION public.arqo_concluir_atendimento(
  p_lead_id uuid,
  p_status_codigo text,
  p_qualificacao_codigo text DEFAULT NULL,
  p_interesse_codigo text DEFAULT NULL,
  p_perfil_codigo text DEFAULT NULL,
  p_acao_codigo text DEFAULT NULL,
  p_acao_data timestamptz DEFAULT NULL,
  p_temperatura_id uuid DEFAULT NULL,
  p_observacao text DEFAULT NULL,
  p_acao_final text DEFAULT 'aplicar',
  p_etapa_destino_id uuid DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user uuid := auth.uid();
  v_atendimento_id uuid;
  v_atendeu boolean := p_status_codigo = 'C07';
  v_etapa_de uuid;
  v_closer uuid;
  v_acao_sistema text;
  v_exige_data boolean := false;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Usuário não autenticado'; END IF;
  IF p_observacao IS NULL OR length(btrim(p_observacao)) = 0 THEN RAISE EXCEPTION 'Observação obrigatória'; END IF;
  IF p_acao_final NOT IN ('aplicar','mover_etapa','liberar','sem_resposta') THEN RAISE EXCEPTION 'Ação final inválida'; END IF;

  SELECT etapa_id, closer_id INTO v_etapa_de, v_closer
  FROM public.arqo_leads
  WHERE id = p_lead_id AND (
    consultor_id = v_user OR public.is_admin(v_user) OR public.has_role(v_user,'arqo_admin') OR public.has_role(v_user,'arqo_gestor')
  )
  FOR UPDATE;
  IF v_etapa_de IS NULL THEN RAISE EXCEPTION 'Lead não encontrado ou sem permissão'; END IF;

  IF NOT EXISTS (SELECT 1 FROM public.arqo_atendimento_opcoes WHERE codigo = p_status_codigo AND grupo = 'status_ligacao' AND is_active) THEN
    RAISE EXCEPTION 'Status de ligação inválido';
  END IF;

  IF v_atendeu AND (p_qualificacao_codigo IS NULL OR p_interesse_codigo IS NULL OR p_perfil_codigo IS NULL OR p_acao_codigo IS NULL OR p_temperatura_id IS NULL) THEN
    RAISE EXCEPTION 'Preencha todas as etapas do atendimento';
  END IF;
  IF NOT v_atendeu AND p_acao_final <> 'sem_resposta' THEN
    RAISE EXCEPTION 'Atendimento sem contato deve ser concluído como sem resposta';
  END IF;
  IF p_acao_final = 'mover_etapa' AND p_etapa_destino_id IS NULL THEN RAISE EXCEPTION 'Etapa de destino obrigatória'; END IF;

  IF p_acao_codigo IS NOT NULL THEN
    SELECT acao_sistema, exige_data INTO v_acao_sistema, v_exige_data
    FROM public.arqo_atendimento_opcoes
    WHERE codigo = p_acao_codigo AND grupo = 'proxima_acao' AND is_active;
    IF NOT FOUND THEN RAISE EXCEPTION 'Próxima ação inválida'; END IF;
    IF v_exige_data AND p_acao_data IS NULL THEN RAISE EXCEPTION 'Informe a data e hora do agendamento'; END IF;
    IF v_exige_data AND p_acao_data <= now() THEN RAISE EXCEPTION 'A data e hora do agendamento devem ser futuras'; END IF;
  END IF;

  INSERT INTO public.arqo_atendimentos (
    lead_id, consultor_id, status_codigo, qualificacao_codigo, interesse_codigo,
    perfil_codigo, acao_codigo, acao_data, temperatura_id, observacao,
    acao_final, etapa_destino_id
  ) VALUES (
    p_lead_id, v_user, p_status_codigo, p_qualificacao_codigo, p_interesse_codigo,
    p_perfil_codigo, p_acao_codigo, CASE WHEN v_exige_data THEN p_acao_data ELSE NULL END,
    p_temperatura_id, btrim(p_observacao), p_acao_final, p_etapa_destino_id
  ) RETURNING id INTO v_atendimento_id;

  UPDATE public.arqo_leads SET
    temperatura_id = COALESCE(p_temperatura_id, temperatura_id),
    ultimo_contato_em = now(),
    proximo_contato_em = CASE WHEN v_exige_data THEN p_acao_data ELSE proximo_contato_em END,
    tentativas_contato = tentativas_contato + CASE WHEN NOT v_atendeu THEN 1 ELSE 0 END,
    etapa_id = CASE WHEN p_acao_final = 'mover_etapa' THEN p_etapa_destino_id ELSE etapa_id END,
    consultor_id = CASE WHEN p_acao_final IN ('liberar', 'sem_resposta') THEN NULL ELSE consultor_id END,
    atribuido_em = CASE WHEN p_acao_final IN ('liberar', 'sem_resposta') THEN NULL ELSE atribuido_em END,
    updated_at = now()
  WHERE id = p_lead_id;

  IF v_acao_sistema = 'agendar_visita' THEN
    INSERT INTO public.arqo_agendamentos (lead_id, tipo, data_hora, responsavel_id, observacoes)
    VALUES (p_lead_id, 'visita', p_acao_data, v_user, p_observacao);
  ELSIF v_acao_sistema = 'agendar_retorno' THEN
    INSERT INTO public.arqo_agendamentos (lead_id, tipo, data_hora, responsavel_id, observacoes)
    VALUES (p_lead_id, 'ligacao', p_acao_data, v_user, p_observacao);
  END IF;

  INSERT INTO public.arqo_lead_events
    (lead_id, tipo, etapa_de, etapa_para, temperatura_para, usuario_id, payload, comentario)
  VALUES (
    p_lead_id, 'atendimento_registrado', v_etapa_de,
    CASE WHEN p_acao_final = 'mover_etapa' THEN p_etapa_destino_id ELSE NULL END,
    p_temperatura_id, v_user,
    jsonb_build_object(
      'atendimento_id', v_atendimento_id,
      'status_codigo', p_status_codigo,
      'qualificacao_codigo', p_qualificacao_codigo,
      'interesse_codigo', p_interesse_codigo,
      'perfil_codigo', p_perfil_codigo,
      'acao_codigo', p_acao_codigo,
      'acao_data', CASE WHEN v_exige_data THEN p_acao_data ELSE NULL END,
      'acao_final', p_acao_final,
      'closer_id', v_closer
    ),
    btrim(p_observacao)
  );
  RETURN v_atendimento_id;
END;
$$;

REVOKE ALL ON FUNCTION public.arqo_concluir_atendimento(uuid,text,text,text,text,text,timestamptz,uuid,text,text,uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.arqo_concluir_atendimento(uuid,text,text,text,text,text,timestamptz,uuid,text,text,uuid) TO authenticated;

-- Libera registros que ficaram presos pelo comportamento anterior, somente
-- quando o evento mais recente do lead é o encerramento sem resposta.
WITH ultimo_evento AS (
  SELECT DISTINCT ON (lead_id) lead_id, tipo, payload
  FROM public.arqo_lead_events
  ORDER BY lead_id, created_at DESC
)
UPDATE public.arqo_leads l
SET consultor_id = NULL, atribuido_em = NULL, updated_at = now()
FROM ultimo_evento ev
WHERE ev.lead_id = l.id
  AND ev.tipo = 'atendimento_registrado'
  AND ev.payload->>'acao_final' = 'sem_resposta'
  AND l.consultor_id IS NOT NULL;

DROP FUNCTION IF EXISTS public.arqo_criar_lead_manual(text, uuid, text, text, text, uuid, uuid, uuid, uuid, numeric, text);

CREATE FUNCTION public.arqo_criar_lead_manual(
  p_nome text,
  p_etapa_id uuid,
  p_cpf text DEFAULT NULL,
  p_telefone text DEFAULT NULL,
  p_email text DEFAULT NULL,
  p_source_id uuid DEFAULT NULL,
  p_temperatura_id uuid DEFAULT NULL,
  p_grupo_id uuid DEFAULT NULL,
  p_empreendimento_id uuid DEFAULT NULL,
  p_valor_estimado numeric DEFAULT NULL,
  p_observacoes text DEFAULT NULL,
  p_telefones_adicionais text[] DEFAULT '{}'::text[]
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user uuid := auth.uid();
  v_cliente_id uuid;
  v_lead_id uuid;
  v_origem text;
  v_telefones text[];
BEGIN
  IF v_user IS NULL OR NOT public.has_role(v_user, 'super_admin') THEN RAISE EXCEPTION 'Apenas superadministradores podem cadastrar leads manualmente'; END IF;
  IF NULLIF(btrim(p_nome), '') IS NULL THEN RAISE EXCEPTION 'Informe o nome do lead'; END IF;

  SELECT COALESCE(array_agg(numero ORDER BY ordem), '{}'::text[])
  INTO v_telefones
  FROM (
    SELECT DISTINCT ON (regexp_replace(btrim(valor), '\D', '', 'g'))
      btrim(valor) AS numero, ordem
    FROM unnest(COALESCE(p_telefones_adicionais, '{}'::text[])) WITH ORDINALITY AS telefone(valor, ordem)
    WHERE NULLIF(regexp_replace(btrim(valor), '\D', '', 'g'), '') IS NOT NULL
    ORDER BY regexp_replace(btrim(valor), '\D', '', 'g'), ordem
  ) telefones;

  IF cardinality(v_telefones) > 4 THEN RAISE EXCEPTION 'Informe no máximo quatro telefones adicionais'; END IF;
  IF NULLIF(btrim(p_telefone), '') IS NULL AND NULLIF(btrim(p_email), '') IS NULL AND cardinality(v_telefones) = 0 THEN
    RAISE EXCEPTION 'Informe ao menos um telefone ou e-mail';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.arqo_funil_etapas WHERE id = p_etapa_id AND is_active) THEN RAISE EXCEPTION 'Etapa inicial inválida ou inativa'; END IF;

  IF p_source_id IS NOT NULL THEN
    SELECT nome INTO v_origem FROM public.arqo_lead_sources WHERE id = p_source_id AND is_active;
    IF v_origem IS NULL THEN RAISE EXCEPTION 'Origem inválida ou inativa'; END IF;
  END IF;
  IF p_temperatura_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.arqo_temperaturas WHERE id = p_temperatura_id AND is_active) THEN RAISE EXCEPTION 'Temperatura inválida ou inativa'; END IF;
  IF p_grupo_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.arqo_grupos_atendimento WHERE id = p_grupo_id AND is_active) THEN RAISE EXCEPTION 'Grupo de atendimento inválido ou inativo'; END IF;
  IF p_empreendimento_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.seven_empreendimentos WHERE id = p_empreendimento_id AND is_active) THEN RAISE EXCEPTION 'Empreendimento inválido ou inativo'; END IF;

  v_cliente_id := public.get_or_create_pessoa(btrim(p_nome), NULLIF(btrim(p_cpf), ''), NULLIF(btrim(p_telefone), ''), NULLIF(btrim(p_email), ''), v_origem);

  INSERT INTO public.arqo_leads (
    cliente_id, source_id, etapa_id, temperatura_id, grupo_id, empreendimento_id,
    valor_estimado, observacoes, telefones_adicionais, created_by
  ) VALUES (
    v_cliente_id, p_source_id, p_etapa_id, p_temperatura_id, p_grupo_id, p_empreendimento_id,
    p_valor_estimado, NULLIF(btrim(p_observacoes), ''), v_telefones, v_user
  ) RETURNING id INTO v_lead_id;

  INSERT INTO public.arqo_lead_events (lead_id, tipo, etapa_para, temperatura_para, usuario_id, payload, comentario)
  VALUES (
    v_lead_id, 'criacao_manual', p_etapa_id, p_temperatura_id, v_user,
    jsonb_build_object('source_id', p_source_id, 'grupo_id', p_grupo_id, 'empreendimento_id', p_empreendimento_id, 'telefones_adicionais', v_telefones),
    'Lead cadastrado manualmente pelo superadministrador'
  );
  RETURN v_lead_id;
END;
$$;

REVOKE ALL ON FUNCTION public.arqo_criar_lead_manual(text, uuid, text, text, text, uuid, uuid, uuid, uuid, numeric, text, text[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.arqo_criar_lead_manual(text, uuid, text, text, text, uuid, uuid, uuid, uuid, numeric, text, text[]) TO authenticated;

DROP FUNCTION IF EXISTS public.arqo_editar_lead_manual(uuid, text, uuid, text, text, text, text, uuid, uuid, uuid, uuid, uuid, uuid, numeric, text);

CREATE FUNCTION public.arqo_editar_lead_manual(
  p_lead_id uuid,
  p_nome text,
  p_etapa_id uuid,
  p_cpf text DEFAULT NULL,
  p_telefone text DEFAULT NULL,
  p_whatsapp text DEFAULT NULL,
  p_email text DEFAULT NULL,
  p_source_id uuid DEFAULT NULL,
  p_temperatura_id uuid DEFAULT NULL,
  p_grupo_id uuid DEFAULT NULL,
  p_consultor_id uuid DEFAULT NULL,
  p_closer_id uuid DEFAULT NULL,
  p_empreendimento_id uuid DEFAULT NULL,
  p_valor_estimado numeric DEFAULT NULL,
  p_observacoes text DEFAULT NULL,
  p_telefones_adicionais text[] DEFAULT '{}'::text[]
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user uuid := auth.uid();
  v_cliente_id uuid;
  v_etapa_anterior uuid;
  v_temperatura_anterior uuid;
  v_grupo_anterior uuid;
  v_consultor_anterior uuid;
  v_closer_anterior uuid;
  v_etapa_encerramento boolean;
  v_telefones text[];
BEGIN
  IF v_user IS NULL OR NOT public.has_role(v_user, 'super_admin') THEN RAISE EXCEPTION 'Apenas superadministradores podem editar leads'; END IF;
  IF NULLIF(btrim(p_nome), '') IS NULL THEN RAISE EXCEPTION 'Informe o nome do lead'; END IF;

  SELECT COALESCE(array_agg(numero ORDER BY ordem), '{}'::text[])
  INTO v_telefones
  FROM (
    SELECT DISTINCT ON (regexp_replace(btrim(valor), '\D', '', 'g'))
      btrim(valor) AS numero, ordem
    FROM unnest(COALESCE(p_telefones_adicionais, '{}'::text[])) WITH ORDINALITY AS telefone(valor, ordem)
    WHERE NULLIF(regexp_replace(btrim(valor), '\D', '', 'g'), '') IS NOT NULL
    ORDER BY regexp_replace(btrim(valor), '\D', '', 'g'), ordem
  ) telefones;

  IF cardinality(v_telefones) > 4 THEN RAISE EXCEPTION 'Informe no máximo quatro telefones adicionais'; END IF;
  IF NULLIF(btrim(p_telefone), '') IS NULL AND NULLIF(btrim(p_whatsapp), '') IS NULL AND NULLIF(btrim(p_email), '') IS NULL AND cardinality(v_telefones) = 0 THEN
    RAISE EXCEPTION 'Informe ao menos um telefone, WhatsApp ou e-mail';
  END IF;

  SELECT cliente_id, etapa_id, temperatura_id, grupo_id, consultor_id, closer_id
  INTO v_cliente_id, v_etapa_anterior, v_temperatura_anterior, v_grupo_anterior, v_consultor_anterior, v_closer_anterior
  FROM public.arqo_leads WHERE id = p_lead_id FOR UPDATE;
  IF v_cliente_id IS NULL THEN RAISE EXCEPTION 'Lead não encontrado'; END IF;

  SELECT is_encerramento INTO v_etapa_encerramento FROM public.arqo_funil_etapas WHERE id = p_etapa_id AND is_active;
  IF v_etapa_encerramento IS NULL THEN RAISE EXCEPTION 'Etapa inválida ou inativa'; END IF;
  IF p_source_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.arqo_lead_sources WHERE id = p_source_id AND is_active) THEN RAISE EXCEPTION 'Origem inválida ou inativa'; END IF;
  IF p_temperatura_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.arqo_temperaturas WHERE id = p_temperatura_id AND is_active) THEN RAISE EXCEPTION 'Temperatura inválida ou inativa'; END IF;
  IF p_grupo_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.arqo_grupos_atendimento WHERE id = p_grupo_id AND is_active) THEN RAISE EXCEPTION 'Grupo inválido ou inativo'; END IF;
  IF p_empreendimento_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.seven_empreendimentos WHERE id = p_empreendimento_id AND is_active) THEN RAISE EXCEPTION 'Empreendimento inválido ou inativo'; END IF;
  IF p_consultor_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_consultor_id AND is_active) THEN RAISE EXCEPTION 'Consultor inválido ou inativo'; END IF;
  IF p_closer_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_closer_id AND is_active) THEN RAISE EXCEPTION 'Closer inválido ou inativo'; END IF;

  UPDATE public.seven_clientes
  SET nome = btrim(p_nome), cpf = NULLIF(btrim(p_cpf), ''), telefone = NULLIF(btrim(p_telefone), ''),
      whatsapp = NULLIF(btrim(p_whatsapp), ''), email = NULLIF(btrim(p_email), ''), updated_at = now()
  WHERE id = v_cliente_id;

  UPDATE public.arqo_leads
  SET etapa_id = p_etapa_id, source_id = p_source_id, temperatura_id = p_temperatura_id,
      grupo_id = p_grupo_id, consultor_id = p_consultor_id, closer_id = p_closer_id,
      empreendimento_id = p_empreendimento_id, valor_estimado = p_valor_estimado,
      observacoes = NULLIF(btrim(p_observacoes), ''), telefones_adicionais = v_telefones,
      fechado_em = CASE WHEN v_etapa_encerramento THEN COALESCE(fechado_em, now()) ELSE NULL END,
      atribuido_em = CASE WHEN p_consultor_id IS DISTINCT FROM v_consultor_anterior THEN CASE WHEN p_consultor_id IS NULL THEN NULL ELSE now() END ELSE atribuido_em END,
      updated_at = now()
  WHERE id = p_lead_id;

  INSERT INTO public.arqo_lead_events (
    lead_id, tipo, etapa_de, etapa_para, temperatura_de, temperatura_para, usuario_id, payload, comentario
  ) VALUES (
    p_lead_id, 'edicao_manual', v_etapa_anterior, p_etapa_id, v_temperatura_anterior, p_temperatura_id, v_user,
    jsonb_build_object(
      'grupo_de', v_grupo_anterior, 'grupo_para', p_grupo_id,
      'consultor_de', v_consultor_anterior, 'consultor_para', p_consultor_id,
      'closer_de', v_closer_anterior, 'closer_para', p_closer_id,
      'telefones_adicionais', v_telefones
    ),
    'Cadastro do lead editado pelo superadministrador'
  );
END;
$$;

REVOKE ALL ON FUNCTION public.arqo_editar_lead_manual(uuid, text, uuid, text, text, text, text, uuid, uuid, uuid, uuid, uuid, uuid, numeric, text, text[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.arqo_editar_lead_manual(uuid, text, uuid, text, text, text, text, uuid, uuid, uuid, uuid, uuid, uuid, numeric, text, text[]) TO authenticated;
