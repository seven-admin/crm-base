-- Fix: ao concluir um atendimento como "não atendeu" (sem_resposta), o lead recebe
-- reserva_ate = now()+horas_reserva (cooldown). A contagem da fila (arqo_fila_grupos) já
-- exclui reservados, mas arqo_atribuir_lead_roleta (usada pelo "Puxar próximo lead")
-- ignorava reserva_ate e ordenava por created_at ASC — então o mesmo lead antigo recém
-- liberado era puxado de novo na hora, voltando "preso" ao usuário.
--
-- Alinha a atribuição com a RPC de referência arqo_puxar_proximo_lead:
--  - respeita reserva_ate (só na atribuição automática; p_lead_id explícito ignora, p/ admin);
--  - limpa a reserva ao atribuir;
--  - ordena por ultimo_contato_em (não-contactados primeiro; "não atendeu" vai pro fim).
CREATE OR REPLACE FUNCTION public.arqo_atribuir_lead_roleta(p_grupo_id uuid, p_lead_id uuid DEFAULT NULL::uuid, p_tipo_atribuicao text DEFAULT 'roleta'::text)
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
      -- Respeita o cooldown de "não atendeu"; atribuição direta (p_lead_id) ignora.
      AND (p_lead_id IS NOT NULL OR l.reserva_ate IS NULL OR l.reserva_ate <= now())
      AND (p_lead_id IS NULL OR l.id = p_lead_id)
    ORDER BY l.ultimo_contato_em ASC NULLS FIRST, l.created_at ASC, l.id ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED
  )
  UPDATE public.arqo_leads l
  SET consultor_id = v_user,
      grupo_id = p_grupo_id,
      atribuido_em = now(),
      reserva_consultor_id = NULL,
      reserva_ate = NULL,
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
