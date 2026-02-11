-- Ajustar permissão do forecast para gestor_produto: somente view com scope proprio
UPDATE public.role_permissions
SET can_view = true,
    can_create = false,
    can_edit = false,
    can_delete = false,
    scope = 'proprio'
WHERE role_id = (SELECT id FROM public.roles WHERE name = 'gestor_produto')
  AND module_id = (SELECT id FROM public.modules WHERE name = 'forecast');