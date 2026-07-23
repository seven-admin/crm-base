-- Após uma tentativa sem resposta, o lead volta à fila, mas não deve ser
-- selecionado novamente antes dos leads que ainda não foram tentados.

CREATE OR REPLACE FUNCTION public.arqo_puxar_proximo_lead(p_grupo_id uuid)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user uuid := auth.uid();
  v_lead uuid;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Usuário não autenticado'; END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.arqo_grupo_membros
    WHERE grupo_id = p_grupo_id AND user_id = v_user AND papel = 'consultor' AND is_active = true
  ) THEN RAISE EXCEPTION 'Usuário não pertence a este grupo como consultor'; END IF;

  IF EXISTS (
    SELECT 1
    FROM public.arqo_leads l
    JOIN public.arqo_funil_etapas e ON e.id = l.etapa_id
    WHERE l.consultor_id = v_user AND l.is_active = true AND l.optout_em IS NULL
      AND l.fechado_em IS NULL AND e.bloqueia_roleta = true
  ) THEN RAISE EXCEPTION 'Você já possui um lead ativo que bloqueia a roleta'; END IF;

  SELECT l.id INTO v_lead
  FROM public.arqo_leads l
  WHERE l.grupo_id = p_grupo_id AND l.consultor_id IS NULL
    AND l.is_active = true AND l.optout_em IS NULL AND l.fechado_em IS NULL
  ORDER BY l.ultimo_contato_em ASC NULLS FIRST, l.created_at ASC, l.id ASC
  FOR UPDATE SKIP LOCKED
  LIMIT 1;

  IF v_lead IS NULL THEN RAISE EXCEPTION 'Nenhum lead disponível neste grupo'; END IF;

  UPDATE public.arqo_leads
  SET consultor_id = v_user, atribuido_em = now(), updated_at = now()
  WHERE id = v_lead;

  INSERT INTO public.arqo_lead_events (lead_id, tipo, usuario_id, payload)
  VALUES (v_lead, 'atribuicao', v_user, jsonb_build_object('grupo_id', p_grupo_id, 'tipo_atribuicao', 'pull_manual'));
  RETURN v_lead;
END;
$$;

REVOKE ALL ON FUNCTION public.arqo_puxar_proximo_lead(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.arqo_puxar_proximo_lead(uuid) TO authenticated;
