-- 1. Criar módulos de planejamento
INSERT INTO public.modules (id, name, display_name, description, route, is_active)
VALUES 
  (gen_random_uuid(), 'planejamento', 'Cronograma de Planejamento', 
   'Visualização do cronograma de obras e tarefas', '/planejamento', true),
  (gen_random_uuid(), 'planejamento_config', 'Configurações do Planejamento', 
   'Gerenciamento de fases e status do planejamento', '/planejamento/configuracoes', true)
ON CONFLICT (name) DO NOTHING;

-- 2. Adicionar permissões de visualização para funcionários Seven
WITH 
  planejamento_module AS (
    SELECT id FROM public.modules WHERE name = 'planejamento'
  ),
  seven_roles AS (
    SELECT id, name FROM public.roles 
    WHERE name IN ('gestor_produto', 'diretor_de_marketing', 'supervisão_de_criação')
    AND is_active = true
  )
INSERT INTO public.role_permissions (
  id, role_id, module_id, can_view, can_create, can_edit, can_delete, scope
)
SELECT 
  gen_random_uuid(),
  sr.id,
  pm.id,
  true,   -- can_view
  false,  -- can_create (restrito a admin)
  false,  -- can_edit (restrito a admin)
  false,  -- can_delete (restrito a admin)
  'empreendimento'  -- scope é TEXT
FROM seven_roles sr
CROSS JOIN planejamento_module pm
ON CONFLICT (role_id, module_id) DO UPDATE SET
  can_view = EXCLUDED.can_view;