CREATE OR REPLACE FUNCTION public.arqo_atualizar_temperatura_lead(
  p_lead_id uuid,
  p_temperatura_id uuid DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_consultor_id uuid;
  v_temperatura_anterior uuid;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  SELECT consultor_id, temperatura_id
  INTO v_consultor_id, v_temperatura_anterior
  FROM public.arqo_leads
  WHERE id = p_lead_id
    AND is_active = true
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Lead não encontrado ou inativo';
  END IF;

  IF NOT (
    public.is_admin(v_user)
    OR public.has_role(v_user, 'arqo_admin')
    OR public.has_role(v_user, 'arqo_gestor')
    OR v_consultor_id = v_user
  ) THEN
    RAISE EXCEPTION 'Você não pode alterar a temperatura deste lead';
  END IF;

  IF p_temperatura_id IS NOT NULL AND NOT EXISTS (
    SELECT 1
    FROM public.arqo_temperaturas
    WHERE id = p_temperatura_id
      AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Temperatura inválida ou inativa';
  END IF;

  IF v_temperatura_anterior IS NOT DISTINCT FROM p_temperatura_id THEN
    RETURN;
  END IF;

  UPDATE public.arqo_leads
  SET temperatura_id = p_temperatura_id,
      updated_at = now()
  WHERE id = p_lead_id;

  INSERT INTO public.arqo_lead_events (
    lead_id,
    tipo,
    temperatura_de,
    temperatura_para,
    usuario_id,
    comentario
  ) VALUES (
    p_lead_id,
    'temperatura_alterada',
    v_temperatura_anterior,
    p_temperatura_id,
    v_user,
    'Temperatura alterada no detalhamento do lead'
  );
END;
$$;

REVOKE ALL ON FUNCTION public.arqo_atualizar_temperatura_lead(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.arqo_atualizar_temperatura_lead(uuid, uuid) TO authenticated;
