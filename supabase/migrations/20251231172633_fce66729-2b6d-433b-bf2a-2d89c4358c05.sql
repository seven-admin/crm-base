-- Adicionar módulos faltantes
INSERT INTO public.modules (name, display_name, description, is_active) VALUES
  ('atividades', 'Atividades', 'Gestão de atividades', true),
  ('agenda', 'Agenda', 'Agenda de compromissos', true),
  ('forecast', 'Forecast', 'Previsão de vendas', true)
ON CONFLICT (name) DO NOTHING;

-- Adicionar permissões para admin
INSERT INTO public.role_permissions (role, module_id, can_view, can_create, can_edit, can_delete, scope)
SELECT 'admin', id, true, true, true, true, 'global'
FROM public.modules
WHERE name IN ('atividades', 'agenda', 'forecast')
ON CONFLICT DO NOTHING;

-- Adicionar permissões para gestor_produto
INSERT INTO public.role_permissions (role, module_id, can_view, can_create, can_edit, can_delete, scope)
SELECT 'gestor_produto', id, true, true, true, false, 'empreendimento'
FROM public.modules
WHERE name IN ('atividades', 'agenda', 'forecast')
ON CONFLICT DO NOTHING;

-- Adicionar permissões para corretor
INSERT INTO public.role_permissions (role, module_id, can_view, can_create, can_edit, can_delete, scope)
SELECT 'corretor', id, true, true, true, false, 'proprio'
FROM public.modules
WHERE name IN ('atividades', 'agenda', 'forecast')
ON CONFLICT DO NOTHING;