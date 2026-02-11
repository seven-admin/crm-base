
-- Adicionar permissão de negociações para Gestores de Produto
INSERT INTO public.role_permissions (role_id, module_id, can_view, can_create, can_edit, can_delete, scope)
SELECT 
  r.id as role_id,
  m.id as module_id,
  true as can_view,
  true as can_create,
  true as can_edit,
  false as can_delete,
  'empreendimento' as scope
FROM roles r, modules m
WHERE r.name = 'gestor_produto' AND m.name = 'negociacoes'
ON CONFLICT (role_id, module_id) DO UPDATE SET
  can_view = true,
  can_create = true,
  can_edit = true;

-- Adicionar permissão de solicitações para Gestores de Produto (se não existir)
INSERT INTO public.role_permissions (role_id, module_id, can_view, can_create, can_edit, can_delete, scope)
SELECT 
  r.id as role_id,
  m.id as module_id,
  true as can_view,
  false as can_create,
  true as can_edit,
  false as can_delete,
  'empreendimento' as scope
FROM roles r, modules m
WHERE r.name = 'gestor_produto' AND m.name = 'solicitacoes'
ON CONFLICT (role_id, module_id) DO UPDATE SET
  can_view = true,
  can_edit = true;
