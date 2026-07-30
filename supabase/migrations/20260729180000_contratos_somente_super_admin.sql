-- Contratos Nexa passam a ser exclusivos do super_admin por padrão. Remove as
-- permissões de papel dos 4 módulos de contrato para todos os papéis exceto
-- super_admin (mantém as linhas para reativação via UI). Concessões continuam
-- possíveis por override de usuário (sistema_user_module_permissions).
UPDATE public.sistema_role_permissions rp
SET can_view = false, can_create = false, can_edit = false, can_delete = false
FROM public.sistema_modules m, public.roles r
WHERE rp.module_id = m.id
  AND rp.role_id = r.id
  AND m.name IN ('nexa_contratos', 'nexa_contratos_modelos', 'nexa_contratos_blocos', 'nexa_contratos_variaveis')
  AND r.name <> 'super_admin';
