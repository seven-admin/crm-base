-- Edição transacional dos dados cadastrais e comerciais de um lead Arqo.

CREATE OR REPLACE FUNCTION public.arqo_editar_lead_manual(
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
  p_observacoes text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_cliente_id uuid;
  v_etapa_anterior uuid;
  v_temperatura_anterior uuid;
  v_grupo_anterior uuid;
  v_consultor_anterior uuid;
  v_closer_anterior uuid;
  v_etapa_encerramento boolean;
BEGIN
  IF v_user IS NULL OR NOT public.has_role(v_user, 'super_admin') THEN
    RAISE EXCEPTION 'Apenas superadministradores podem editar leads';
  END IF;

  IF NULLIF(btrim(p_nome), '') IS NULL THEN
    RAISE EXCEPTION 'Informe o nome do lead';
  END IF;

  IF NULLIF(btrim(p_telefone), '') IS NULL
     AND NULLIF(btrim(p_whatsapp), '') IS NULL
     AND NULLIF(btrim(p_email), '') IS NULL THEN
    RAISE EXCEPTION 'Informe ao menos um telefone, WhatsApp ou e-mail';
  END IF;

  SELECT cliente_id, etapa_id, temperatura_id, grupo_id, consultor_id, closer_id
  INTO v_cliente_id, v_etapa_anterior, v_temperatura_anterior, v_grupo_anterior, v_consultor_anterior, v_closer_anterior
  FROM public.arqo_leads
  WHERE id = p_lead_id
  FOR UPDATE;

  IF v_cliente_id IS NULL THEN
    RAISE EXCEPTION 'Lead não encontrado';
  END IF;

  SELECT is_encerramento INTO v_etapa_encerramento
  FROM public.arqo_funil_etapas
  WHERE id = p_etapa_id AND is_active = true;

  IF v_etapa_encerramento IS NULL THEN
    RAISE EXCEPTION 'Etapa inválida ou inativa';
  END IF;

  IF p_source_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.arqo_lead_sources WHERE id = p_source_id AND is_active = true
  ) THEN RAISE EXCEPTION 'Origem inválida ou inativa'; END IF;

  IF p_temperatura_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.arqo_temperaturas WHERE id = p_temperatura_id AND is_active = true
  ) THEN RAISE EXCEPTION 'Temperatura inválida ou inativa'; END IF;

  IF p_grupo_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.arqo_grupos_atendimento WHERE id = p_grupo_id AND is_active = true
  ) THEN RAISE EXCEPTION 'Grupo inválido ou inativo'; END IF;

  IF p_empreendimento_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.seven_empreendimentos WHERE id = p_empreendimento_id AND is_active = true
  ) THEN RAISE EXCEPTION 'Empreendimento inválido ou inativo'; END IF;

  IF p_consultor_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = p_consultor_id AND is_active = true
  ) THEN RAISE EXCEPTION 'Consultor inválido ou inativo'; END IF;

  IF p_closer_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = p_closer_id AND is_active = true
  ) THEN RAISE EXCEPTION 'Closer inválido ou inativo'; END IF;

  UPDATE public.seven_clientes
  SET nome = btrim(p_nome),
      cpf = NULLIF(btrim(p_cpf), ''),
      telefone = NULLIF(btrim(p_telefone), ''),
      whatsapp = NULLIF(btrim(p_whatsapp), ''),
      email = NULLIF(btrim(p_email), ''),
      updated_at = now()
  WHERE id = v_cliente_id;

  UPDATE public.arqo_leads
  SET etapa_id = p_etapa_id,
      source_id = p_source_id,
      temperatura_id = p_temperatura_id,
      grupo_id = p_grupo_id,
      consultor_id = p_consultor_id,
      closer_id = p_closer_id,
      empreendimento_id = p_empreendimento_id,
      valor_estimado = p_valor_estimado,
      observacoes = NULLIF(btrim(p_observacoes), ''),
      fechado_em = CASE
        WHEN v_etapa_encerramento THEN COALESCE(fechado_em, now())
        ELSE NULL
      END,
      atribuido_em = CASE
        WHEN p_consultor_id IS DISTINCT FROM v_consultor_anterior THEN
          CASE WHEN p_consultor_id IS NULL THEN NULL ELSE now() END
        ELSE atribuido_em
      END,
      updated_at = now()
  WHERE id = p_lead_id;

  INSERT INTO public.arqo_lead_events (
    lead_id, tipo, etapa_de, etapa_para, temperatura_de, temperatura_para,
    usuario_id, payload, comentario
  ) VALUES (
    p_lead_id,
    'edicao_manual',
    v_etapa_anterior,
    p_etapa_id,
    v_temperatura_anterior,
    p_temperatura_id,
    v_user,
    jsonb_build_object(
      'grupo_de', v_grupo_anterior,
      'grupo_para', p_grupo_id,
      'consultor_de', v_consultor_anterior,
      'consultor_para', p_consultor_id,
      'closer_de', v_closer_anterior,
      'closer_para', p_closer_id
    ),
    'Cadastro do lead editado pelo superadministrador'
  );
END;
$$;

REVOKE ALL ON FUNCTION public.arqo_editar_lead_manual(uuid, text, uuid, text, text, text, text, uuid, uuid, uuid, uuid, uuid, uuid, numeric, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.arqo_editar_lead_manual(uuid, text, uuid, text, text, text, text, uuid, uuid, uuid, uuid, uuid, uuid, numeric, text) TO authenticated;
