-- Migrar todos os user_roles que têm role (enum) mas não têm role_id
-- Atualizar role_id baseado no valor do enum role

UPDATE user_roles ur
SET role_id = r.id
FROM roles r
WHERE ur.role::text = r.name
AND ur.role_id IS NULL;