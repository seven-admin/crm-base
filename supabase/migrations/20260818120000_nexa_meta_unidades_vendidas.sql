-- NEXA · meta semanal de quantidade de unidades vendidas.

ALTER TABLE public.nexa_metas
  ADD COLUMN IF NOT EXISTS meta_semanal_unidades_vendidas integer NOT NULL DEFAULT 0
  CHECK (meta_semanal_unidades_vendidas >= 0);

DROP FUNCTION IF EXISTS public.nexa_salvar_meta(
  text, date, date, integer, integer, integer, integer, numeric, boolean, uuid[], uuid
);

CREATE OR REPLACE FUNCTION public.nexa_salvar_meta(
  p_nome text,
  p_vigencia_inicio date,
  p_vigencia_fim date,
  p_meta_semanal_visitas integer,
  p_meta_semanal_atendimentos integer,
  p_meta_semanal_impacto integer,
  p_meta_semanal_engajamento integer,
  p_meta_semanal_unidades_vendidas integer,
  p_meta_semanal_vgv numeric,
  p_is_active boolean,
  p_user_ids uuid[],
  p_meta_id uuid DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_meta_id uuid;
  v_user_ids uuid[];
BEGIN
  IF v_user IS NULL OR NOT public.is_super_admin(v_user) THEN
    RAISE EXCEPTION 'Usuário sem permissão para configurar metas';
  END IF;

  IF NULLIF(btrim(p_nome), '') IS NULL THEN
    RAISE EXCEPTION 'Informe o nome da meta';
  END IF;
  IF p_vigencia_inicio IS NULL OR (p_vigencia_fim IS NOT NULL AND p_vigencia_fim < p_vigencia_inicio) THEN
    RAISE EXCEPTION 'Vigência inválida';
  END IF;
  IF p_meta_semanal_visitas < 0 OR p_meta_semanal_atendimentos < 0
    OR p_meta_semanal_impacto < 0 OR p_meta_semanal_engajamento < 0
    OR p_meta_semanal_unidades_vendidas < 0 OR p_meta_semanal_vgv < 0 THEN
    RAISE EXCEPTION 'As metas não podem ser negativas';
  END IF;

  SELECT coalesce(array_agg(DISTINCT user_id), '{}'::uuid[])
  INTO v_user_ids
  FROM unnest(coalesce(p_user_ids, '{}'::uuid[])) AS selected(user_id);

  IF cardinality(v_user_ids) = 0 THEN
    RAISE EXCEPTION 'Selecione ao menos um usuário';
  END IF;
  IF EXISTS (
    SELECT 1
    FROM unnest(v_user_ids) selected(user_id)
    LEFT JOIN public.profiles profile ON profile.id = selected.user_id AND profile.is_active = true
    WHERE profile.id IS NULL
  ) THEN
    RAISE EXCEPTION 'A lista contém usuário inválido ou inativo';
  END IF;

  IF p_meta_id IS NULL THEN
    INSERT INTO public.nexa_metas (
      nome, vigencia_inicio, vigencia_fim,
      meta_semanal_visitas, meta_semanal_atendimentos,
      meta_semanal_impacto, meta_semanal_engajamento,
      meta_semanal_unidades_vendidas, meta_semanal_vgv, is_active
    ) VALUES (
      btrim(p_nome), p_vigencia_inicio, p_vigencia_fim,
      p_meta_semanal_visitas, p_meta_semanal_atendimentos,
      p_meta_semanal_impacto, p_meta_semanal_engajamento,
      p_meta_semanal_unidades_vendidas, p_meta_semanal_vgv, p_is_active
    )
    RETURNING id INTO v_meta_id;
  ELSE
    UPDATE public.nexa_metas
    SET nome = btrim(p_nome),
        vigencia_inicio = p_vigencia_inicio,
        vigencia_fim = p_vigencia_fim,
        meta_semanal_visitas = p_meta_semanal_visitas,
        meta_semanal_atendimentos = p_meta_semanal_atendimentos,
        meta_semanal_impacto = p_meta_semanal_impacto,
        meta_semanal_engajamento = p_meta_semanal_engajamento,
        meta_semanal_unidades_vendidas = p_meta_semanal_unidades_vendidas,
        meta_semanal_vgv = p_meta_semanal_vgv,
        is_active = p_is_active,
        updated_at = now()
    WHERE id = p_meta_id
    RETURNING id INTO v_meta_id;

    IF v_meta_id IS NULL THEN
      RAISE EXCEPTION 'Meta não encontrada';
    END IF;
    DELETE FROM public.nexa_meta_usuarios WHERE meta_id = v_meta_id;
  END IF;

  INSERT INTO public.nexa_meta_usuarios(meta_id, user_id)
  SELECT v_meta_id, selected.user_id
  FROM unnest(v_user_ids) selected(user_id);

  RETURN v_meta_id;
END;
$$;

REVOKE ALL ON FUNCTION public.nexa_salvar_meta(
  text, date, date, integer, integer, integer, integer, integer, numeric, boolean, uuid[], uuid
) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.nexa_salvar_meta(
  text, date, date, integer, integer, integer, integer, integer, numeric, boolean, uuid[], uuid
) FROM anon;
GRANT EXECUTE ON FUNCTION public.nexa_salvar_meta(
  text, date, date, integer, integer, integer, integer, integer, numeric, boolean, uuid[], uuid
) TO authenticated;
