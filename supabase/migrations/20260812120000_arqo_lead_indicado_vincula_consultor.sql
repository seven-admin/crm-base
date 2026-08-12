-- Ao gerar um lead indicado DURANTE o atendimento, ele nascia com consultor_id = NULL
-- e caía na fila do grupo (podendo ser puxado por outro consultor). A regra nova: o lead
-- indicado fica vinculado a quem o criou (consultor_id = v_user, atribuido_em = now()),
-- entrando direto na carteira dele em vez de voltar para a fila geral.
CREATE OR REPLACE FUNCTION public.arqo_criar_lead_indicado(
  p_lead_origem_id uuid,
  p_nome text,
  p_telefone text DEFAULT NULL,
  p_email text DEFAULT NULL,
  p_empreendimento_id uuid DEFAULT NULL,
  p_observacoes text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user uuid := auth.uid();
  v_cliente uuid;
  v_lead uuid;
  v_etapa uuid;
  v_source uuid;
  v_grupo uuid;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Usuário não autenticado'; END IF;
  IF p_nome IS NULL OR length(btrim(p_nome)) = 0 THEN RAISE EXCEPTION 'Nome obrigatório'; END IF;
  IF COALESCE(btrim(p_telefone),'') = '' AND COALESCE(btrim(p_email),'') = '' THEN RAISE EXCEPTION 'Informe telefone ou e-mail'; END IF;

  SELECT grupo_id INTO v_grupo FROM public.arqo_leads
  WHERE id = p_lead_origem_id AND (consultor_id = v_user OR closer_id = v_user OR public.is_admin(v_user) OR public.has_role(v_user,'arqo_admin') OR public.has_role(v_user,'arqo_gestor'));
  IF NOT FOUND THEN RAISE EXCEPTION 'Lead de origem não encontrado ou sem permissão'; END IF;

  v_cliente := public.get_or_create_pessoa(p_nome, NULL, p_telefone, p_email, 'Indicação');
  SELECT id INTO v_etapa FROM public.arqo_funil_etapas WHERE categoria = 'ativa' AND is_active ORDER BY ordem LIMIT 1;
  SELECT id INTO v_source FROM public.arqo_lead_sources WHERE lower(nome) = lower('Indicação') LIMIT 1;

  INSERT INTO public.arqo_leads (
    cliente_id, source_id, etapa_id, grupo_id, empreendimento_id, observacoes,
    indicado_por_lead_id, consultor_id, atribuido_em, created_by
  ) VALUES (
    v_cliente, v_source, v_etapa, v_grupo, p_empreendimento_id,
    NULLIF(btrim(p_observacoes),''), p_lead_origem_id, v_user, now(), v_user
  ) RETURNING id INTO v_lead;

  INSERT INTO public.arqo_lead_events (lead_id, tipo, usuario_id, payload, comentario)
  VALUES (p_lead_origem_id, 'lead_indicado_gerado', v_user, jsonb_build_object('lead_indicado_id', v_lead), p_observacoes);
  INSERT INTO public.arqo_lead_events (lead_id, tipo, usuario_id, payload)
  VALUES (v_lead, 'indicacao_recebida', v_user, jsonb_build_object('lead_origem_id', p_lead_origem_id));
  INSERT INTO public.arqo_lead_events (lead_id, tipo, usuario_id, payload)
  VALUES (v_lead, 'atribuicao', v_user, jsonb_build_object('grupo_id', v_grupo, 'tipo_atribuicao', 'indicacao'));
  RETURN v_lead;
END;
$$;

GRANT EXECUTE ON FUNCTION public.arqo_criar_lead_indicado(uuid,text,text,text,uuid,text) TO authenticated;
