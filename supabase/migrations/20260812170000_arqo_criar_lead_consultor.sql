-- "Inserir cliente" na home do consultor: libera arqo_criar_lead_manual para papéis ARQO
-- (não só super_admin). Quando quem cria é consultor/closer (não gestor/admin), o lead já
-- nasce vinculado a ele (consultor_id + atribuido_em) — entra direto na carteira dele.
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
  v_is_gestor boolean;
  v_consultor uuid;
BEGIN
  v_is_gestor := public.is_admin(v_user) OR public.has_role(v_user,'super_admin')
    OR public.has_role(v_user,'arqo_admin') OR public.has_role(v_user,'arqo_gestor');

  IF v_user IS NULL OR NOT (
    v_is_gestor OR public.has_role(v_user,'arqo_consultor') OR public.has_role(v_user,'arqo_closer')
  ) THEN
    RAISE EXCEPTION 'Sem permissão para cadastrar leads';
  END IF;
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

  -- Consultor/closer: lead nasce vinculado a ele. Gestor/admin: sem dono (vai pra fila/grupo).
  v_consultor := CASE WHEN v_is_gestor THEN NULL ELSE v_user END;

  INSERT INTO public.arqo_leads (
    cliente_id, source_id, etapa_id, temperatura_id, grupo_id, empreendimento_id,
    valor_estimado, observacoes, telefones_adicionais, consultor_id, atribuido_em, created_by
  ) VALUES (
    v_cliente_id, p_source_id, p_etapa_id, p_temperatura_id, p_grupo_id, p_empreendimento_id,
    p_valor_estimado, NULLIF(btrim(p_observacoes), ''), v_telefones,
    v_consultor, CASE WHEN v_consultor IS NULL THEN NULL ELSE now() END, v_user
  ) RETURNING id INTO v_lead_id;

  INSERT INTO public.arqo_lead_events (lead_id, tipo, etapa_para, temperatura_para, usuario_id, payload, comentario)
  VALUES (
    v_lead_id, 'criacao_manual', p_etapa_id, p_temperatura_id, v_user,
    jsonb_build_object('source_id', p_source_id, 'grupo_id', p_grupo_id, 'empreendimento_id', p_empreendimento_id, 'telefones_adicionais', v_telefones),
    'Lead cadastrado manualmente'
  );

  IF v_consultor IS NOT NULL THEN
    INSERT INTO public.arqo_lead_events (lead_id, tipo, usuario_id, payload)
    VALUES (v_lead_id, 'atribuicao', v_user, jsonb_build_object('grupo_id', p_grupo_id, 'tipo_atribuicao', 'criacao_consultor'));
  END IF;

  RETURN v_lead_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.arqo_criar_lead_manual(text, uuid, text, text, text, uuid, uuid, uuid, uuid, numeric, text, text[]) TO authenticated;
