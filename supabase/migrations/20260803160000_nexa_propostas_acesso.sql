-- Acesso por usuário aos empreendimentos, para o feed de propostas/análises de crédito
-- (dados vêm da NEXA). Cada usuário vê no dashboard as propostas dos empreendimentos
-- atribuídos a ele; admin vê todos.
CREATE TABLE public.nexa_propostas_acesso (
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  empreendimento_id uuid NOT NULL REFERENCES public.seven_empreendimentos(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, empreendimento_id)
);

CREATE INDEX idx_nexa_propostas_acesso_user ON public.nexa_propostas_acesso(user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.nexa_propostas_acesso TO authenticated;
GRANT ALL ON public.nexa_propostas_acesso TO service_role;
ALTER TABLE public.nexa_propostas_acesso ENABLE ROW LEVEL SECURITY;

-- Cada um lê o próprio acesso; admin/gestor leem e gerenciam tudo.
CREATE POLICY "Ver próprio acesso ou admin" ON public.nexa_propostas_acesso FOR SELECT TO authenticated
  USING (
    user_id = (select auth.uid())
    OR public.is_admin((select auth.uid()))
    OR public.has_role((select auth.uid()), 'nexa_admin')
    OR public.has_role((select auth.uid()), 'nexa_gestor')
  );
CREATE POLICY "Admins gerenciam acesso" ON public.nexa_propostas_acesso FOR ALL TO authenticated
  USING (
    public.is_admin((select auth.uid()))
    OR public.has_role((select auth.uid()), 'nexa_admin')
    OR public.has_role((select auth.uid()), 'nexa_gestor')
  )
  WITH CHECK (
    public.is_admin((select auth.uid()))
    OR public.has_role((select auth.uid()), 'nexa_admin')
    OR public.has_role((select auth.uid()), 'nexa_gestor')
  );

-- Módulo da tela de atribuição
INSERT INTO public.sistema_modules (name, display_name, description, route, is_active) VALUES
  ('nexa_propostas_acesso', 'Nexa · Acesso a Propostas', 'Quem vê propostas de cada empreendimento', '/nexa/propostas-acesso', true)
ON CONFLICT (name) DO UPDATE SET display_name = EXCLUDED.display_name, route = EXCLUDED.route, is_active = true;

WITH mods AS (SELECT id FROM public.sistema_modules WHERE name = 'nexa_propostas_acesso')
INSERT INTO public.sistema_role_permissions (role_id, module_id, can_view, can_create, can_edit, can_delete, scope)
SELECT r.id, m.id, true, true, true, true, 'global'
FROM public.roles r CROSS JOIN mods m
WHERE r.name IN ('nexa_admin', 'nexa_gestor')
ON CONFLICT (role_id, module_id) DO UPDATE SET
  can_view = EXCLUDED.can_view, can_create = EXCLUDED.can_create,
  can_edit = EXCLUDED.can_edit, can_delete = EXCLUDED.can_delete;
