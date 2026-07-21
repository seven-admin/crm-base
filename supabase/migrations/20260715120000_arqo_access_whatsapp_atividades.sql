-- A Arqo passa a usar a mesma tabela/automação de resumo de WhatsApp já criada para a
-- Nexa (nexa_whatsapp_atividades) — não há uma tabela separada por empresa, o feed é único.

comment on table public.nexa_whatsapp_atividades is
  'Resumos diários de conversas de WhatsApp gerados por automação n8n (lê as conversas do dia, resume, classifica por categoria e registra próximas atividades). Compartilhada entre Nexa e Arqo.';

-- Corrige grants explícitos ausentes na migração original (convenção do projeto).
GRANT SELECT, INSERT, UPDATE, DELETE ON public.nexa_whatsapp_atividades TO authenticated;
GRANT ALL ON public.nexa_whatsapp_atividades TO service_role;

ALTER POLICY "Nexa users view whatsapp atividades" ON public.nexa_whatsapp_atividades
  USING (
    is_admin(auth.uid()) OR is_nexa_user(auth.uid())
    OR has_role(auth.uid(),'arqo_admin') OR has_role(auth.uid(),'arqo_gestor')
    OR has_role(auth.uid(),'arqo_consultor') OR has_role(auth.uid(),'arqo_closer')
  );

ALTER POLICY "Nexa users insert whatsapp atividades" ON public.nexa_whatsapp_atividades
  WITH CHECK (
    is_admin(auth.uid()) OR is_nexa_user(auth.uid())
    OR has_role(auth.uid(),'arqo_admin') OR has_role(auth.uid(),'arqo_gestor')
    OR has_role(auth.uid(),'arqo_consultor') OR has_role(auth.uid(),'arqo_closer')
  );

ALTER POLICY "Nexa users update whatsapp atividades" ON public.nexa_whatsapp_atividades
  USING (
    is_admin(auth.uid()) OR is_nexa_user(auth.uid())
    OR has_role(auth.uid(),'arqo_admin') OR has_role(auth.uid(),'arqo_gestor')
    OR has_role(auth.uid(),'arqo_consultor') OR has_role(auth.uid(),'arqo_closer')
  )
  WITH CHECK (
    is_admin(auth.uid()) OR is_nexa_user(auth.uid())
    OR has_role(auth.uid(),'arqo_admin') OR has_role(auth.uid(),'arqo_gestor')
    OR has_role(auth.uid(),'arqo_consultor') OR has_role(auth.uid(),'arqo_closer')
  );

-- Delete continua restrito a admin/super_admin (mesmo comportamento de hoje, sem mudança).

-- ============ Registrar módulo + permissões por role (menu "Atividades" na Arqo) ============
INSERT INTO public.sistema_modules (name, display_name, description, route, is_active) VALUES
  ('arqo_atividades', 'Arqo · Atividades', 'Resumo automático de conversas de WhatsApp dos leads', '/arqo/atividades', true)
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  route = EXCLUDED.route,
  is_active = true;

WITH mods AS (
  SELECT id, name FROM public.sistema_modules WHERE name = 'arqo_atividades'
),
role_defs AS (
  SELECT r.id AS role_id, r.name AS role_name, m.id AS module_id, m.name AS module_name,
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
