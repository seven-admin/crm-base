CREATE OR REPLACE FUNCTION public.arqo_atribuir_lead_roleta(
  p_grupo_id uuid,
  p_lead_id uuid DEFAULT NULL,
  p_tipo_atribuicao text DEFAULT 'roleta'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user uuid := auth.uid();
  v_is_member boolean;
  v_lead_id uuid;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.arqo_grupo_membros
    WHERE grupo_id = p_grupo_id
      AND user_id = v_user
      AND is_active = true
  ) INTO v_is_member;

  IF NOT v_is_member THEN
    RAISE EXCEPTION 'Você não é membro ativo deste grupo de atendimento';
  END IF;

  WITH proximo_lead AS (
    SELECT l.id
    FROM public.arqo_leads l
    WHERE l.grupo_id = p_grupo_id
      AND l.is_active = true
      AND l.consultor_id IS NULL
      AND l.fechado_em IS NULL
      AND l.optout_em IS NULL
      AND (p_lead_id IS NULL OR l.id = p_lead_id)
    ORDER BY l.created_at ASC, l.id ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED
  )
  UPDATE public.arqo_leads l
  SET consultor_id = v_user,
      grupo_id = p_grupo_id,
      atribuido_em = now(),
      updated_at = now()
  FROM proximo_lead pl
  WHERE l.id = pl.id
  RETURNING l.id INTO v_lead_id;

  IF v_lead_id IS NULL THEN
    RAISE EXCEPTION 'Nenhum lead disponível neste grupo no momento';
  END IF;

  INSERT INTO public.arqo_lead_events (lead_id, tipo, usuario_id, payload)
  VALUES (
    v_lead_id,
    'atribuicao',
    v_user,
    jsonb_build_object('grupo_id', p_grupo_id, 'tipo_atribuicao', p_tipo_atribuicao)
  );

  RETURN v_lead_id;
END;
$function$;