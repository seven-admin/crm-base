-- Adicionar módulo briefings se não existir
INSERT INTO public.modules (name, display_name, description, is_active)
VALUES ('briefings', 'Briefings', 'Sistema de solicitação de peças de marketing', true)
ON CONFLICT (name) DO NOTHING;

-- Dar permissão para admin, gestor_produto e equipe de marketing
INSERT INTO public.role_permissions (role, module_id, can_view, can_create, can_edit, can_delete)
SELECT 'admin', id, true, true, true, true FROM public.modules WHERE name = 'briefings'
ON CONFLICT (role, module_id) DO NOTHING;

INSERT INTO public.role_permissions (role, module_id, can_view, can_create, can_edit, can_delete)
SELECT 'gestor_produto', id, true, true, true, true FROM public.modules WHERE name = 'briefings'
ON CONFLICT (role, module_id) DO NOTHING;

INSERT INTO public.role_permissions (role, module_id, can_view, can_create, can_edit, can_delete)
SELECT 'equipe_marketing', id, true, true, true, false FROM public.modules WHERE name = 'briefings'
ON CONFLICT (role, module_id) DO NOTHING;

INSERT INTO public.role_permissions (role, module_id, can_view, can_create, can_edit, can_delete)
SELECT 'supervisor_criacao', id, true, true, true, false FROM public.modules WHERE name = 'briefings'
ON CONFLICT (role, module_id) DO NOTHING;

INSERT INTO public.role_permissions (role, module_id, can_view, can_create, can_edit, can_delete)
SELECT 'supervisor_render', id, true, true, true, false FROM public.modules WHERE name = 'briefings'
ON CONFLICT (role, module_id) DO NOTHING;

INSERT INTO public.role_permissions (role, module_id, can_view, can_create, can_edit, can_delete)
SELECT 'supervisor_video', id, true, true, true, false FROM public.modules WHERE name = 'briefings'
ON CONFLICT (role, module_id) DO NOTHING;

INSERT INTO public.role_permissions (role, module_id, can_view, can_create, can_edit, can_delete)
SELECT 'supervisor_relacionamento', id, true, true, true, false FROM public.modules WHERE name = 'briefings'
ON CONFLICT (role, module_id) DO NOTHING;

-- Incorporadores podem criar e ver briefings
INSERT INTO public.role_permissions (role, module_id, can_view, can_create, can_edit, can_delete)
SELECT 'incorporador', id, true, true, false, false FROM public.modules WHERE name = 'briefings'
ON CONFLICT (role, module_id) DO NOTHING;