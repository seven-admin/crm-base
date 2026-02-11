-- Criar módulo portal_incorporador
INSERT INTO modules (name, display_name, route, is_active)
VALUES ('portal_incorporador', 'Portal do Contratante', '/portal-incorporador', true);

-- Configurar permissões para o role incorporador (7ffff9af-4793-4f70-9ae1-c7211eccb579)
INSERT INTO role_permissions (role_id, module_id, can_view, can_create, can_edit, can_delete, scope)
SELECT 
  '7ffff9af-4793-4f70-9ae1-c7211eccb579',
  m.id,
  true,  -- can_view
  false, -- can_create
  false, -- can_edit
  false, -- can_delete
  'empreendimento'
FROM modules m
WHERE m.name = 'portal_incorporador';