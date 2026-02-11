-- Adicionar permissões para os novos módulos com scopes corretos

-- 1. Permissões padrão para admin
INSERT INTO public.role_permissions (role, module_id, can_view, can_create, can_edit, can_delete, scope)
SELECT 'admin', m.id, true, true, true, true, 'global'
FROM public.modules m
WHERE m.name IN ('atividades', 'agenda', 'forecast');

-- 2. Permissões para gestor_produto
INSERT INTO public.role_permissions (role, module_id, can_view, can_create, can_edit, can_delete, scope)
SELECT 'gestor_produto', m.id, true, true, true, true, 'global'
FROM public.modules m
WHERE m.name IN ('atividades', 'agenda', 'forecast');

-- 3. Permissões para corretor
INSERT INTO public.role_permissions (role, module_id, can_view, can_create, can_edit, can_delete, scope)
SELECT 'corretor', m.id, true, true, true, false, 'proprio'
FROM public.modules m
WHERE m.name IN ('atividades', 'agenda');

INSERT INTO public.role_permissions (role, module_id, can_view, can_create, can_edit, can_delete, scope)
SELECT 'corretor', m.id, true, false, false, false, 'proprio'
FROM public.modules m
WHERE m.name = 'forecast';