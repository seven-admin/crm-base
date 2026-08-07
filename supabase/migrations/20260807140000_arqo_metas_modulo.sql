-- Módulo Arqo · Metas: dashboard de desempenho no mesmo formato do /metas da NEXA.
-- A infra de metas (arqo_metas_atendimento + RPC arqo_salvar_meta_atendimento) já existe;
-- aqui só registramos o módulo/rota e as permissões por papel.
INSERT INTO public.sistema_modules (name, display_name, description, route, is_active) VALUES
  ('arqo_metas', 'Arqo · Metas', 'Metas de atendimento e dashboard de desempenho', '/arqo/metas', true)
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  route = EXCLUDED.route,
  is_active = true;

WITH mods AS (
  SELECT id, name FROM public.sistema_modules WHERE name = 'arqo_metas'
),
role_defs AS (
  SELECT r.id AS role_id, m.id AS module_id,
    CASE
      WHEN r.name IN ('arqo_admin','arqo_gestor') THEN ARRAY[true,true,true,true]
      WHEN r.name IN ('arqo_consultor','arqo_closer') THEN ARRAY[true,false,false,false]
      ELSE NULL
    END AS perms
  FROM public.roles r CROSS JOIN mods m
  WHERE r.name IN ('arqo_admin','arqo_gestor','arqo_consultor','arqo_closer')
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
