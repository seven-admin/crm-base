-- NEXA · Metas semanais + registro manual de atividades (Visitas/Atendimentos)
-- Espelha o modelo da ARQO (arqo_metas_atendimento + arqo_meta_usuarios + RPC),
-- mas com dados próprios da NEXA: apenas metas semanais e duas atividades
-- (visita e atendimento) registradas manualmente, com participantes por imobiliária.

-- ============ Registro de atividades ============
CREATE TABLE public.nexa_atividades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo text NOT NULL CHECK (tipo IN ('visita','atendimento')),
  data_hora timestamptz NOT NULL,
  local text,
  qtd_pessoas integer CHECK (qtd_pessoas IS NULL OR qtd_pessoas >= 0),
  observacoes text,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_nexa_atividades_criador ON public.nexa_atividades(created_by, data_hora DESC);
CREATE INDEX idx_nexa_atividades_tipo_data ON public.nexa_atividades(tipo, data_hora DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.nexa_atividades TO authenticated;
GRANT ALL ON public.nexa_atividades TO service_role;
ALTER TABLE public.nexa_atividades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Nexa users view atividades" ON public.nexa_atividades FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()) OR public.is_nexa_user(auth.uid()));
CREATE POLICY "Nexa users insert atividades" ON public.nexa_atividades FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()) OR public.is_nexa_user(auth.uid()));
CREATE POLICY "Nexa users update atividades" ON public.nexa_atividades FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()) OR created_by = auth.uid())
  WITH CHECK (public.is_admin(auth.uid()) OR created_by = auth.uid());
CREATE POLICY "Nexa users delete atividades" ON public.nexa_atividades FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()) OR created_by = auth.uid());

CREATE TRIGGER trg_nexa_atividades_updated_at BEFORE UPDATE ON public.nexa_atividades
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ Participantes (corretores por imobiliária) ============
CREATE TABLE public.nexa_atividade_participantes (
  atividade_id uuid NOT NULL REFERENCES public.nexa_atividades(id) ON DELETE CASCADE,
  corretor_id uuid NOT NULL REFERENCES public.seven_corretores(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (atividade_id, corretor_id)
);

CREATE INDEX idx_nexa_atividade_participantes_corretor
  ON public.nexa_atividade_participantes(corretor_id, atividade_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.nexa_atividade_participantes TO authenticated;
GRANT ALL ON public.nexa_atividade_participantes TO service_role;
ALTER TABLE public.nexa_atividade_participantes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Nexa users view participantes" ON public.nexa_atividade_participantes FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()) OR public.is_nexa_user(auth.uid()));
CREATE POLICY "Nexa users write participantes" ON public.nexa_atividade_participantes FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()) OR public.is_nexa_user(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()) OR public.is_nexa_user(auth.uid()));

-- ============ Metas semanais ============
CREATE TABLE public.nexa_metas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  vigencia_inicio date NOT NULL DEFAULT CURRENT_DATE,
  vigencia_fim date,
  meta_semanal_visitas integer NOT NULL DEFAULT 0 CHECK (meta_semanal_visitas >= 0),
  meta_semanal_atendimentos integer NOT NULL DEFAULT 0 CHECK (meta_semanal_atendimentos >= 0),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (vigencia_fim IS NULL OR vigencia_fim >= vigencia_inicio)
);

CREATE INDEX idx_nexa_metas_vigencia
  ON public.nexa_metas(vigencia_inicio DESC) WHERE is_active = true;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.nexa_metas TO authenticated;
GRANT ALL ON public.nexa_metas TO service_role;
ALTER TABLE public.nexa_metas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Nexa users view metas" ON public.nexa_metas FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()) OR public.is_nexa_user(auth.uid()));
CREATE POLICY "Nexa admins manage metas" ON public.nexa_metas FOR ALL TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR public.has_role(auth.uid(), 'nexa_admin')
    OR public.has_role(auth.uid(), 'nexa_gestor')
  )
  WITH CHECK (
    public.is_admin(auth.uid())
    OR public.has_role(auth.uid(), 'nexa_admin')
    OR public.has_role(auth.uid(), 'nexa_gestor')
  );

CREATE TRIGGER trg_nexa_metas_updated_at BEFORE UPDATE ON public.nexa_metas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.nexa_meta_usuarios (
  meta_id uuid NOT NULL REFERENCES public.nexa_metas(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (meta_id, user_id)
);

CREATE INDEX idx_nexa_meta_usuarios_user ON public.nexa_meta_usuarios(user_id, meta_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.nexa_meta_usuarios TO authenticated;
GRANT ALL ON public.nexa_meta_usuarios TO service_role;
ALTER TABLE public.nexa_meta_usuarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Nexa users view meta_usuarios" ON public.nexa_meta_usuarios FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()) OR public.is_nexa_user(auth.uid()));
CREATE POLICY "Nexa admins write meta_usuarios" ON public.nexa_meta_usuarios FOR ALL TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR public.has_role(auth.uid(), 'nexa_admin')
    OR public.has_role(auth.uid(), 'nexa_gestor')
  )
  WITH CHECK (
    public.is_admin(auth.uid())
    OR public.has_role(auth.uid(), 'nexa_admin')
    OR public.has_role(auth.uid(), 'nexa_gestor')
  );

-- ============ RPC: salvar meta + atribuição N:N ============
CREATE OR REPLACE FUNCTION public.nexa_salvar_meta(
  p_nome text,
  p_vigencia_inicio date,
  p_vigencia_fim date,
  p_meta_semanal_visitas integer,
  p_meta_semanal_atendimentos integer,
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
    OR public.has_role(v_user, 'nexa_admin')
    OR public.has_role(v_user, 'nexa_gestor')
  ) THEN
    RAISE EXCEPTION 'Usuário sem permissão para configurar metas';
  END IF;

  IF NULLIF(btrim(p_nome), '') IS NULL THEN
    RAISE EXCEPTION 'Informe o nome da meta';
  END IF;
  IF p_vigencia_inicio IS NULL OR (p_vigencia_fim IS NOT NULL AND p_vigencia_fim < p_vigencia_inicio) THEN
    RAISE EXCEPTION 'Vigência inválida';
  END IF;
  IF p_meta_semanal_visitas < 0 OR p_meta_semanal_atendimentos < 0 THEN
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
      meta_semanal_visitas, meta_semanal_atendimentos, is_active
    ) VALUES (
      btrim(p_nome), p_vigencia_inicio, p_vigencia_fim,
      p_meta_semanal_visitas, p_meta_semanal_atendimentos, p_is_active
    )
    RETURNING id INTO v_meta_id;
  ELSE
    UPDATE public.nexa_metas
    SET nome = btrim(p_nome),
        vigencia_inicio = p_vigencia_inicio,
        vigencia_fim = p_vigencia_fim,
        meta_semanal_visitas = p_meta_semanal_visitas,
        meta_semanal_atendimentos = p_meta_semanal_atendimentos,
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
  text, date, date, integer, integer, boolean, uuid[], uuid
) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.nexa_salvar_meta(
  text, date, date, integer, integer, boolean, uuid[], uuid
) FROM anon;
GRANT EXECUTE ON FUNCTION public.nexa_salvar_meta(
  text, date, date, integer, integer, boolean, uuid[], uuid
) TO authenticated;

-- ============ Módulo + permissões ============
INSERT INTO public.sistema_modules (name, display_name, description, route, is_active) VALUES
  ('nexa_metas', 'Nexa · Metas', 'Metas semanais e dashboard de atividades', '/nexa/metas', true)
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  route = EXCLUDED.route,
  is_active = true;

WITH mods AS (
  SELECT id, name FROM public.sistema_modules WHERE name = 'nexa_metas'
),
role_defs AS (
  SELECT r.id AS role_id, m.id AS module_id,
    CASE
      WHEN r.name IN ('nexa_admin','nexa_gestor') THEN ARRAY[true,true,true,true]
      WHEN r.name = 'nexa_corretor' THEN ARRAY[true,false,false,false]
      ELSE NULL
    END AS perms
  FROM public.roles r CROSS JOIN mods m
  WHERE r.name IN ('nexa_admin','nexa_gestor','nexa_corretor')
)
INSERT INTO public.sistema_role_permissions (role_id, module_id, can_view, can_create, can_edit, can_delete, scope)
SELECT role_id, module_id, perms[1], perms[2], perms[3], perms[4], 'global'
FROM role_defs
WHERE perms IS NOT NULL
ON CONFLICT (role_id, module_id) DO UPDATE SET
  can_view = EXCLUDED.can_view,
  can_create = EXCLUDED.can_create,
  can_edit = EXCLUDED.can_edit,
  can_delete = EXCLUDED.can_delete;
