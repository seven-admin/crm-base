-- Novos campos de meta pedidos na home do consultor ARQO: META VGV, Prospeção e Ações
-- (diária + semanal). Colunas com default 0 para não quebrar metas existentes.

ALTER TABLE public.arqo_metas_atendimento
  ADD COLUMN IF NOT EXISTS meta_diaria_prospeccao  integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS meta_semanal_prospeccao integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS meta_diaria_acoes       integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS meta_semanal_acoes      integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS meta_diaria_vgv         numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS meta_semanal_vgv        numeric NOT NULL DEFAULT 0;

-- Recria o RPC de salvar metas com os novos parâmetros (defaults 0 → retrocompatível).
DROP FUNCTION IF EXISTS public.arqo_salvar_meta_atendimento(
  text, date, date, integer, integer, integer, integer,
  integer, integer, integer, integer, boolean, uuid[], uuid
);

CREATE OR REPLACE FUNCTION public.arqo_salvar_meta_atendimento(
  p_nome text,
  p_vigencia_inicio date,
  p_vigencia_fim date,
  p_meta_diaria_ligacoes integer,
  p_meta_diaria_conversas integer,
  p_meta_diaria_agendamentos integer,
  p_meta_diaria_visitas_realizadas integer,
  p_meta_semanal_ligacoes integer,
  p_meta_semanal_conversas integer,
  p_meta_semanal_agendamentos integer,
  p_meta_semanal_visitas_realizadas integer,
  p_is_active boolean,
  p_user_ids uuid[],
  p_meta_id uuid DEFAULT NULL,
  p_meta_diaria_prospeccao integer DEFAULT 0,
  p_meta_semanal_prospeccao integer DEFAULT 0,
  p_meta_diaria_acoes integer DEFAULT 0,
  p_meta_semanal_acoes integer DEFAULT 0,
  p_meta_diaria_vgv numeric DEFAULT 0,
  p_meta_semanal_vgv numeric DEFAULT 0
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
  IF v_user IS NULL OR NOT (
    public.is_admin(v_user)
    OR public.has_role(v_user, 'arqo_admin')
    OR public.has_role(v_user, 'arqo_gestor')
  ) THEN
    RAISE EXCEPTION 'Usuário sem permissão para configurar metas';
  END IF;

  IF NULLIF(btrim(p_nome), '') IS NULL THEN
    RAISE EXCEPTION 'Informe o nome da meta';
  END IF;
  IF p_vigencia_inicio IS NULL OR (p_vigencia_fim IS NOT NULL AND p_vigencia_fim < p_vigencia_inicio) THEN
    RAISE EXCEPTION 'Vigência inválida';
  END IF;
  IF p_meta_diaria_ligacoes < 0 OR p_meta_diaria_conversas < 0
    OR p_meta_diaria_agendamentos < 0 OR p_meta_diaria_visitas_realizadas < 0
    OR p_meta_semanal_ligacoes < 0 OR p_meta_semanal_conversas < 0
    OR p_meta_semanal_agendamentos < 0 OR p_meta_semanal_visitas_realizadas < 0
    OR p_meta_diaria_prospeccao < 0 OR p_meta_semanal_prospeccao < 0
    OR p_meta_diaria_acoes < 0 OR p_meta_semanal_acoes < 0
    OR p_meta_diaria_vgv < 0 OR p_meta_semanal_vgv < 0 THEN
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
    INSERT INTO public.arqo_metas_atendimento (
      nome, user_id, grupo_id, vigencia_inicio, vigencia_fim,
      meta_diaria_ligacoes, meta_diaria_conversas, meta_diaria_agendamentos,
      meta_diaria_visitas_realizadas, meta_semanal_ligacoes,
      meta_semanal_conversas, meta_semanal_agendamentos,
      meta_semanal_visitas_realizadas, is_active,
      meta_diaria_prospeccao, meta_semanal_prospeccao,
      meta_diaria_acoes, meta_semanal_acoes,
      meta_diaria_vgv, meta_semanal_vgv
    ) VALUES (
      btrim(p_nome), v_user_ids[1], NULL, p_vigencia_inicio, p_vigencia_fim,
      p_meta_diaria_ligacoes, p_meta_diaria_conversas, p_meta_diaria_agendamentos,
      p_meta_diaria_visitas_realizadas, p_meta_semanal_ligacoes,
      p_meta_semanal_conversas, p_meta_semanal_agendamentos,
      p_meta_semanal_visitas_realizadas, p_is_active,
      p_meta_diaria_prospeccao, p_meta_semanal_prospeccao,
      p_meta_diaria_acoes, p_meta_semanal_acoes,
      p_meta_diaria_vgv, p_meta_semanal_vgv
    )
    RETURNING id INTO v_meta_id;
  ELSE
    UPDATE public.arqo_metas_atendimento
    SET nome = btrim(p_nome),
        user_id = v_user_ids[1],
        grupo_id = NULL,
        vigencia_inicio = p_vigencia_inicio,
        vigencia_fim = p_vigencia_fim,
        meta_diaria_ligacoes = p_meta_diaria_ligacoes,
        meta_diaria_conversas = p_meta_diaria_conversas,
        meta_diaria_agendamentos = p_meta_diaria_agendamentos,
        meta_diaria_visitas_realizadas = p_meta_diaria_visitas_realizadas,
        meta_semanal_ligacoes = p_meta_semanal_ligacoes,
        meta_semanal_conversas = p_meta_semanal_conversas,
        meta_semanal_agendamentos = p_meta_semanal_agendamentos,
        meta_semanal_visitas_realizadas = p_meta_semanal_visitas_realizadas,
        meta_diaria_prospeccao = p_meta_diaria_prospeccao,
        meta_semanal_prospeccao = p_meta_semanal_prospeccao,
        meta_diaria_acoes = p_meta_diaria_acoes,
        meta_semanal_acoes = p_meta_semanal_acoes,
        meta_diaria_vgv = p_meta_diaria_vgv,
        meta_semanal_vgv = p_meta_semanal_vgv,
        is_active = p_is_active,
        updated_at = now()
    WHERE id = p_meta_id
    RETURNING id INTO v_meta_id;

    IF v_meta_id IS NULL THEN
      RAISE EXCEPTION 'Meta não encontrada';
    END IF;
    DELETE FROM public.arqo_meta_usuarios WHERE meta_id = v_meta_id;
  END IF;

  INSERT INTO public.arqo_meta_usuarios(meta_id, user_id)
  SELECT v_meta_id, selected.user_id
  FROM unnest(v_user_ids) selected(user_id);

  RETURN v_meta_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.arqo_salvar_meta_atendimento(
  text, date, date, integer, integer, integer, integer,
  integer, integer, integer, integer, boolean, uuid[], uuid,
  integer, integer, integer, integer, numeric, numeric
) TO authenticated;
