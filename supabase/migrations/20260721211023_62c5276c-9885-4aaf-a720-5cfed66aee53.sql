CREATE OR REPLACE FUNCTION public.arqo_atribuir_lead_roleta(p_grupo_id uuid, p_lead_id uuid, p_tipo_atribuicao text DEFAULT 'roleta'::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user uuid := auth.uid();
  v_is_member boolean;
  v_has_active boolean;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  -- Valida que o caller é membro ativo do grupo
  SELECT EXISTS (
    SELECT 1 FROM public.arqo_grupo_membros
    WHERE grupo_id = p_grupo_id AND user_id = v_user AND is_active = true
  ) INTO v_is_member;

  IF NOT v_is_member THEN
    RAISE EXCEPTION 'Você não é membro ativo deste grupo de atendimento';
  END IF;

  -- Verifica se o caller já tem lead ativo bloqueando roleta
  SELECT EXISTS (
    SELECT 1 FROM public.arqo_leads l
    LEFT JOIN public.arqo_funil_etapas e ON e.id = l.etapa_id
    WHERE l.consultor_id = v_user
      AND l.is_active = true
      AND l.optout_em IS NULL
      AND l.fechado_em IS NULL
      AND COALESCE(e.bloqueia_roleta, true) = true
  ) INTO v_has_active;

  IF v_has_active THEN
    RAISE EXCEPTION 'Você já possui um lead ativo. Finalize ou libere antes de puxar outro.';
  END IF;

  -- Atribui o lead ao caller
  UPDATE public.arqo_leads
  SET consultor_id = v_user, grupo_id = p_grupo_id, atribuido_em = now(), updated_at = now()
  WHERE id = p_lead_id
    AND consultor_id IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Este lead já foi atribuído a outro consultor';
  END IF;

  INSERT INTO public.arqo_lead_events (lead_id, tipo, usuario_id, payload)
  VALUES (p_lead_id, 'atribuicao', v_user, jsonb_build_object('grupo_id', p_grupo_id, 'tipo_atribuicao', p_tipo_atribuicao));

  RETURN v_user;
END;
$function$;