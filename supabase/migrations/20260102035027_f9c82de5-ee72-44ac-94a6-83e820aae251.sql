-- Inserir permissões completas para super_admin em todos os módulos ativos
INSERT INTO role_permissions (role, module_id, can_view, can_create, can_edit, can_delete, scope)
SELECT 
  'super_admin'::app_role,
  m.id,
  true,
  true,
  true,
  true,
  'global'
FROM modules m
WHERE m.is_active = true
  AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp 
    WHERE rp.role = 'super_admin' AND rp.module_id = m.id
  );

-- Limpar tabela de auditoria
DELETE FROM audit_logs;