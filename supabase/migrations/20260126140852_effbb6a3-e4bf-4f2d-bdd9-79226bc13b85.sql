-- Adicionar permissões para o role diretor_de_marketing
INSERT INTO role_permissions (role, module_id, can_view, can_create, can_edit, can_delete, scope)
VALUES
  -- Dashboard Executivo (visualização)
  ('diretor_de_marketing', '319c48ad-6bf8-4f57-b68f-4bcf84040dd9', true, false, false, false, 'global'),
  
  -- Projetos de Marketing (acesso total)
  ('diretor_de_marketing', 'e8d4fe27-a4fe-4033-8b9e-c3795fdb9159', true, true, true, true, 'global'),
  
  -- Config. Workflow Marketing (acesso total)
  ('diretor_de_marketing', '0802a585-fbc7-40a7-94d5-4dbc8eedd386', true, true, true, true, 'global'),
  
  -- Briefings (acesso total)
  ('diretor_de_marketing', '43be8d14-9db0-46a5-9756-f5926757ffd1', true, true, true, true, 'global'),
  
  -- Calendário de Eventos (acesso total)
  ('diretor_de_marketing', 'b042dfe2-b925-442c-b72b-c26276b89fcc', true, true, true, true, 'global'),
  
  -- Templates de Evento (acesso total)
  ('diretor_de_marketing', 'f0d1ec3b-ea5a-45bf-8e5c-08e4462a54a9', true, true, true, true, 'global'),
  
  -- Empreendimentos (somente visualização)
  ('diretor_de_marketing', '0d1019b5-ef9c-4744-ab0b-22877512ae5d', true, false, false, false, 'global'),
  
  -- Relatórios (somente visualização)
  ('diretor_de_marketing', '713a265f-7007-48bc-b324-2d9eae3faeef', true, false, false, false, 'global');