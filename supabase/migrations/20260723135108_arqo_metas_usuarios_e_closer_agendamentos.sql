-- Quatro metas operacionais, atribuição para múltiplos usuários e
-- encaminhamento automático dos agendamentos ao closer do grupo.

ALTER TABLE public.arqo_metas_atendimento
  RENAME COLUMN meta_diaria_atendimentos TO meta_diaria_ligacoes;
ALTER TABLE public.arqo_metas_atendimento
  RENAME COLUMN meta_diaria_retornos TO meta_diaria_conversas;
ALTER TABLE public.arqo_metas_atendimento
  RENAME COLUMN meta_diaria_visitas TO meta_diaria_agendamentos;
ALTER TABLE public.arqo_metas_atendimento
  RENAME COLUMN meta_diaria_conversoes TO meta_diaria_visitas_realizadas;
ALTER TABLE public.arqo_metas_atendimento
  RENAME COLUMN meta_semanal_atendimentos TO meta_semanal_ligacoes;
ALTER TABLE public.arqo_metas_atendimento
  RENAME COLUMN meta_semanal_retornos TO meta_semanal_conversas;
ALTER TABLE public.arqo_metas_atendimento
  RENAME COLUMN meta_semanal_visitas TO meta_semanal_agendamentos;
ALTER TABLE public.arqo_metas_atendimento
  RENAME COLUMN meta_semanal_conversoes TO meta_semanal_visitas_realizadas;

ALTER TABLE public.arqo_performance_config
  RENAME COLUMN peso_atendimentos TO peso_ligacoes;
ALTER TABLE public.arqo_performance_config
  RENAME COLUMN peso_retornos TO peso_conversas;
ALTER TABLE public.arqo_performance_config
  RENAME COLUMN peso_visitas TO peso_agendamentos;
ALTER TABLE public.arqo_performance_config
  RENAME COLUMN peso_conversoes TO peso_visitas_realizadas;

-- A atribuição passa a ser N:N. As colunas user_id/grupo_id são mantidas
-- apenas para compatibilidade com integrações antigas.
DO $$
DECLARE
  v_constraint record;
BEGIN
  FOR v_constraint IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.arqo_metas_atendimento'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%user_id IS NOT NULL%'
      AND pg_get_constraintdef(oid) ILIKE '%grupo_id IS NOT NULL%'
  LOOP
    EXECUTE format(
      'ALTER TABLE public.arqo_metas_atendimento DROP CONSTRAINT %I',
      v_constraint.conname
    );
  END LOOP;
END;
$$;

CREATE TABLE public.arqo_meta_usuarios (
  meta_id uuid NOT NULL REFERENCES public.arqo_metas_atendimento(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (meta_id, user_id)
);

CREATE INDEX idx_arqo_meta_usuarios_user
  ON public.arqo_meta_usuarios(user_id, meta_id);

ALTER TABLE public.arqo_meta_usuarios ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.arqo_meta_usuarios TO authenticated;
GRANT ALL ON public.arqo_meta_usuarios TO service_role;

CREATE POLICY arqo_meta_usuarios_select
  ON public.arqo_meta_usuarios
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY arqo_meta_usuarios_write
  ON public.arqo_meta_usuarios
  FOR ALL TO authenticated
  USING (
    public.is_admin((select auth.uid()))
    OR public.has_role((select auth.uid()), 'arqo_admin')
    OR public.has_role((select auth.uid()), 'arqo_gestor')
  )
  WITH CHECK (
    public.is_admin((select auth.uid()))
    OR public.has_role((select auth.uid()), 'arqo_admin')
    OR public.has_role((select auth.uid()), 'arqo_gestor')
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
    OR p_meta_semanal_agendamentos < 0 OR p_meta_semanal_visitas_realizadas < 0 THEN
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
      meta_semanal_visitas_realizadas, is_active
    ) VALUES (
      btrim(p_nome), v_user_ids[1], NULL, p_vigencia_inicio, p_vigencia_fim,
      p_meta_diaria_ligacoes, p_meta_diaria_conversas, p_meta_diaria_agendamentos,
      p_meta_diaria_visitas_realizadas, p_meta_semanal_ligacoes,
      p_meta_semanal_conversas, p_meta_semanal_agendamentos,
      p_meta_semanal_visitas_realizadas, p_is_active
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

REVOKE ALL ON FUNCTION public.arqo_salvar_meta_atendimento(
  text, date, date, integer, integer, integer, integer,
  integer, integer, integer, integer, boolean, uuid[], uuid
) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.arqo_salvar_meta_atendimento(
  text, date, date, integer, integer, integer, integer,
  integer, integer, integer, integer, boolean, uuid[], uuid
) FROM anon;
GRANT EXECUTE ON FUNCTION public.arqo_salvar_meta_atendimento(
  text, date, date, integer, integer, integer, integer,
  integer, integer, integer, integer, boolean, uuid[], uuid
) TO authenticated;

ALTER TABLE public.arqo_grupos_atendimento
  ADD COLUMN closer_id uuid REFERENCES public.profiles(id) ON DELETE RESTRICT;

-- Aproveita o closer ativo já vinculado como membro quando ele existe.
UPDATE public.arqo_grupos_atendimento grupo
SET closer_id = (
  SELECT grupo_membro.user_id
  FROM public.arqo_grupo_membros grupo_membro
  WHERE grupo_membro.grupo_id = grupo.id
    AND grupo_membro.papel = 'closer'
    AND grupo_membro.is_active = true
  ORDER BY grupo_membro.ordem_roleta, grupo_membro.created_at
  LIMIT 1
)
WHERE grupo.closer_id IS NULL
  AND EXISTS (
    SELECT 1
    FROM public.arqo_grupo_membros grupo_membro
    WHERE grupo_membro.grupo_id = grupo.id
      AND grupo_membro.papel = 'closer'
      AND grupo_membro.is_active = true
  );

ALTER TABLE public.arqo_grupos_atendimento
  ADD CONSTRAINT arqo_grupos_atendimento_closer_obrigatorio
  CHECK (closer_id IS NOT NULL) NOT VALID;

ALTER TABLE public.arqo_agendamentos
  ADD COLUMN closer_id uuid REFERENCES public.profiles(id) ON DELETE RESTRICT;

CREATE INDEX idx_arqo_agendamentos_closer_data
  ON public.arqo_agendamentos(closer_id, data_hora);

UPDATE public.arqo_agendamentos agendamento
SET closer_id = grupo.closer_id
FROM public.arqo_leads lead
JOIN public.arqo_grupos_atendimento grupo ON grupo.id = lead.grupo_id
WHERE lead.id = agendamento.lead_id
  AND agendamento.closer_id IS NULL
  AND grupo.closer_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.arqo_definir_closer_agendamento()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_closer uuid;
  v_grupo uuid;
BEGIN
  SELECT lead.grupo_id, grupo.closer_id
  INTO v_grupo, v_closer
  FROM public.arqo_leads lead
  LEFT JOIN public.arqo_grupos_atendimento grupo ON grupo.id = lead.grupo_id
  WHERE lead.id = NEW.lead_id;

  IF v_grupo IS NULL THEN
    RAISE EXCEPTION 'O lead precisa estar vinculado a um grupo antes do agendamento';
  END IF;
  IF v_closer IS NULL THEN
    RAISE EXCEPTION 'O grupo do lead não possui closer configurado';
  END IF;

  NEW.closer_id := v_closer;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.arqo_definir_closer_agendamento() FROM PUBLIC;

CREATE TRIGGER trg_arqo_agendamento_closer
  BEFORE INSERT OR UPDATE OF lead_id ON public.arqo_agendamentos
  FOR EACH ROW
  EXECUTE FUNCTION public.arqo_definir_closer_agendamento();

DROP POLICY IF EXISTS arqo_agend_select ON public.arqo_agendamentos;
CREATE POLICY arqo_agend_select
  ON public.arqo_agendamentos
  FOR SELECT TO authenticated
  USING (
    closer_id = (select auth.uid())
    OR EXISTS (
      SELECT 1
      FROM public.arqo_leads lead
      WHERE lead.id = lead_id
        AND (
          public.is_admin((select auth.uid()))
          OR public.has_role((select auth.uid()), 'arqo_admin')
          OR public.has_role((select auth.uid()), 'arqo_gestor')
          OR lead.consultor_id = (select auth.uid())
          OR lead.closer_id = (select auth.uid())
        )
    )
  );

DROP POLICY IF EXISTS arqo_agend_write ON public.arqo_agendamentos;
CREATE POLICY arqo_agend_write
  ON public.arqo_agendamentos
  FOR ALL TO authenticated
  USING (
    closer_id = (select auth.uid())
    OR EXISTS (
      SELECT 1
      FROM public.arqo_leads lead
      WHERE lead.id = lead_id
        AND (
          public.is_admin((select auth.uid()))
          OR public.has_role((select auth.uid()), 'arqo_admin')
          OR public.has_role((select auth.uid()), 'arqo_gestor')
          OR lead.consultor_id = (select auth.uid())
          OR lead.closer_id = (select auth.uid())
        )
    )
  )
  WITH CHECK (
    closer_id = (select auth.uid())
    OR EXISTS (
      SELECT 1
      FROM public.arqo_leads lead
      WHERE lead.id = lead_id
        AND (
          public.is_admin((select auth.uid()))
          OR public.has_role((select auth.uid()), 'arqo_admin')
          OR public.has_role((select auth.uid()), 'arqo_gestor')
          OR lead.consultor_id = (select auth.uid())
          OR lead.closer_id = (select auth.uid())
        )
    )
  );
