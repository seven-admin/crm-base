-- Cadastro individual de leads no administrativo da Arqo.
-- A função concentra a criação/recuperação do cliente e do lead na mesma transação.

CREATE OR REPLACE FUNCTION public.arqo_criar_lead_manual(
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
  p_observacoes text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_cliente_id uuid;
  v_lead_id uuid;
  v_origem text;
BEGIN
  IF v_user IS NULL OR NOT public.has_role(v_user, 'super_admin') THEN
    RAISE EXCEPTION 'Apenas superadministradores podem cadastrar leads manualmente';
  END IF;

  IF NULLIF(btrim(p_nome), '') IS NULL THEN
    RAISE EXCEPTION 'Informe o nome do lead';
  END IF;

  IF NULLIF(btrim(p_telefone), '') IS NULL AND NULLIF(btrim(p_email), '') IS NULL THEN
    RAISE EXCEPTION 'Informe ao menos um telefone ou e-mail';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.arqo_funil_etapas
    WHERE id = p_etapa_id AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Etapa inicial inválida ou inativa';
  END IF;

  IF p_source_id IS NOT NULL THEN
    SELECT nome INTO v_origem
    FROM public.arqo_lead_sources
    WHERE id = p_source_id AND is_active = true;

    IF v_origem IS NULL THEN
      RAISE EXCEPTION 'Origem inválida ou inativa';
    END IF;
  END IF;

  IF p_temperatura_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.arqo_temperaturas
    WHERE id = p_temperatura_id AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Temperatura inválida ou inativa';
  END IF;

  IF p_grupo_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.arqo_grupos_atendimento
    WHERE id = p_grupo_id AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Grupo de atendimento inválido ou inativo';
  END IF;

  IF p_empreendimento_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.seven_empreendimentos
    WHERE id = p_empreendimento_id AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Empreendimento inválido ou inativo';
  END IF;

  v_cliente_id := public.get_or_create_pessoa(
    btrim(p_nome),
    NULLIF(btrim(p_cpf), ''),
    NULLIF(btrim(p_telefone), ''),
    NULLIF(btrim(p_email), ''),
    v_origem
  );

  INSERT INTO public.arqo_leads (
    cliente_id,
    source_id,
    etapa_id,
    temperatura_id,
    grupo_id,
    empreendimento_id,
    valor_estimado,
    observacoes,
    created_by
  ) VALUES (
    v_cliente_id,
    p_source_id,
    p_etapa_id,
    p_temperatura_id,
    p_grupo_id,
    p_empreendimento_id,
    p_valor_estimado,
    NULLIF(btrim(p_observacoes), ''),
    v_user
  ) RETURNING id INTO v_lead_id;

  INSERT INTO public.arqo_lead_events (
    lead_id,
    tipo,
    etapa_para,
    temperatura_para,
    usuario_id,
    payload,
    comentario
  ) VALUES (
    v_lead_id,
    'criacao_manual',
    p_etapa_id,
    p_temperatura_id,
    v_user,
    jsonb_build_object(
      'source_id', p_source_id,
      'grupo_id', p_grupo_id,
      'empreendimento_id', p_empreendimento_id
    ),
    'Lead cadastrado manualmente pelo superadministrador'
  );

  RETURN v_lead_id;
END;
$$;

REVOKE ALL ON FUNCTION public.arqo_criar_lead_manual(text, uuid, text, text, text, uuid, uuid, uuid, uuid, numeric, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.arqo_criar_lead_manual(text, uuid, text, text, text, uuid, uuid, uuid, uuid, numeric, text) TO authenticated;

