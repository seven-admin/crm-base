-- Data manual somente para ações que representam agendamento futuro.
-- O momento do atendimento permanece registrado automaticamente em encerrado_em.

UPDATE public.arqo_atendimento_opcoes
SET exige_data = codigo IN ('A01', 'A02')
WHERE grupo = 'proxima_acao'
  AND codigo IN ('A01', 'A02', 'A03', 'A04', 'A05', 'A06');

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
    IF v_exige_data AND p_acao_data IS NULL THEN
      RAISE EXCEPTION 'Informe a data e hora do agendamento';
    END IF;
    IF v_exige_data AND p_acao_data <= now() THEN
      RAISE EXCEPTION 'A data e hora do agendamento devem ser futuras';
    END IF;
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
    consultor_id = CASE WHEN p_acao_final = 'liberar' THEN NULL ELSE consultor_id END,
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

GRANT EXECUTE ON FUNCTION public.arqo_concluir_atendimento(uuid,text,text,text,text,text,timestamptz,uuid,text,text,uuid) TO authenticated;
