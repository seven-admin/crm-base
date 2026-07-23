CREATE OR REPLACE FUNCTION public.arqo_reabrir_atendimento_historico(
  p_atendimento_id uuid
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_lead_id uuid;
  v_grupo_id uuid;
  v_consultor_atual uuid;
  v_is_active boolean;
  v_optout_em timestamptz;
  v_fechado_em timestamptz;
  v_etapa_encerramento boolean;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  SELECT atendimento.lead_id
  INTO v_lead_id
  FROM public.arqo_atendimentos atendimento
  WHERE atendimento.id = p_atendimento_id
    AND (
      atendimento.consultor_id = v_user
      OR public.is_admin(v_user)
      OR public.has_role(v_user, 'arqo_admin')
      OR public.has_role(v_user, 'arqo_gestor')
    );

  IF v_lead_id IS NULL THEN
    RAISE EXCEPTION 'Contato não encontrado ou sem permissão';
  END IF;

  SELECT
    lead.grupo_id,
    lead.consultor_id,
    lead.is_active,
    lead.optout_em,
    lead.fechado_em,
    etapa.is_encerramento
  INTO
    v_grupo_id,
    v_consultor_atual,
    v_is_active,
    v_optout_em,
    v_fechado_em,
    v_etapa_encerramento
  FROM public.arqo_leads lead
  JOIN public.arqo_funil_etapas etapa ON etapa.id = lead.etapa_id
  WHERE lead.id = v_lead_id
  FOR UPDATE OF lead;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'O lead deste contato não existe mais';
  END IF;
  IF NOT v_is_active OR v_optout_em IS NOT NULL THEN
    RAISE EXCEPTION 'Este lead está inativo ou não permite novos contatos';
  END IF;
  IF v_fechado_em IS NOT NULL OR v_etapa_encerramento THEN
    RAISE EXCEPTION 'Este lead já está encerrado';
  END IF;

  IF NOT (
    public.is_admin(v_user)
    OR public.has_role(v_user, 'arqo_admin')
    OR public.has_role(v_user, 'arqo_gestor')
  ) AND NOT EXISTS (
    SELECT 1
    FROM public.arqo_grupo_membros membro
    WHERE membro.grupo_id = v_grupo_id
      AND membro.user_id = v_user
      AND membro.papel = 'consultor'
      AND membro.is_active = true
  ) THEN
    RAISE EXCEPTION 'Você não pertence mais ao grupo deste lead';
  END IF;

  IF v_consultor_atual IS NOT NULL AND v_consultor_atual <> v_user THEN
    RAISE EXCEPTION 'Este lead já está em atendimento por outro consultor';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.arqo_leads lead
    JOIN public.arqo_funil_etapas etapa ON etapa.id = lead.etapa_id
    WHERE lead.consultor_id = v_user
      AND lead.id <> v_lead_id
      AND lead.is_active = true
      AND lead.optout_em IS NULL
      AND lead.fechado_em IS NULL
      AND etapa.bloqueia_roleta = true
  ) THEN
    RAISE EXCEPTION 'Conclua o atendimento em andamento antes de iniciar outro';
  END IF;

  IF v_consultor_atual IS NULL THEN
    UPDATE public.arqo_leads
    SET consultor_id = v_user,
        atribuido_em = now(),
        updated_at = now()
    WHERE id = v_lead_id;

    INSERT INTO public.arqo_lead_events (lead_id, tipo, usuario_id, payload)
    VALUES (
      v_lead_id,
      'reatribuicao_historico',
      v_user,
      jsonb_build_object('atendimento_origem_id', p_atendimento_id)
    );
  END IF;

  RETURN v_lead_id;
END;
$$;

REVOKE ALL ON FUNCTION public.arqo_reabrir_atendimento_historico(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.arqo_reabrir_atendimento_historico(uuid) TO authenticated;
