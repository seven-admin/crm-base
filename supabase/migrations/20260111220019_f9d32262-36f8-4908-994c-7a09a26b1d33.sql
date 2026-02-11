-- =====================================================
-- INSERIR PERMISSÕES PADRÃO PARA O MÓDULO PROPOSTAS (SCOPE CORRIGIDO)
-- =====================================================
INSERT INTO public.role_permissions (role, module_id, scope, can_view, can_create, can_edit, can_delete)
SELECT 
  r.name::app_role,
  (SELECT id FROM public.modules WHERE name = 'propostas'),
  CASE 
    WHEN r.name IN ('admin', 'incorporador', 'gerente_comercial') THEN 'global'
    WHEN r.name = 'gestor_produto' THEN 'empreendimento'
    ELSE 'proprio'
  END,
  true,
  CASE WHEN r.name IN ('admin', 'incorporador', 'gerente_comercial', 'gestor_produto') THEN true ELSE false END,
  CASE WHEN r.name IN ('admin', 'incorporador', 'gerente_comercial', 'gestor_produto') THEN true ELSE false END,
  CASE WHEN r.name IN ('admin', 'incorporador') THEN true ELSE false END
FROM public.roles r
WHERE r.is_active = true
  AND r.name IN ('admin', 'incorporador', 'gerente_comercial', 'gestor_produto', 'corretor')
ON CONFLICT (role, module_id) DO UPDATE SET
  scope = EXCLUDED.scope,
  can_view = EXCLUDED.can_view,
  can_create = EXCLUDED.can_create,
  can_edit = EXCLUDED.can_edit,
  can_delete = EXCLUDED.can_delete;