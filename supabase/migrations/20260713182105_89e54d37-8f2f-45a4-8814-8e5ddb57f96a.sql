-- 1) Registrar módulos granulares
INSERT INTO public.sistema_modules (name, display_name, description, route, is_active) VALUES
  ('arqo_roleta',           'Arqo · Roleta',            'Puxar próximo lead atribuído',       '/arqo/roleta',            true),
  ('arqo_leads',            'Arqo · Kanban de Leads',   'Pipeline de leads em kanban',        '/arqo/leads',             true),
  ('arqo_forecast',         'Arqo · Forecast',          'Previsão de vendas Arqo',            '/arqo/forecast',          true),
  ('arqo_admin',            'Arqo · Admin & Leads',     'Gestão administrativa e importação', '/arqo/admin',             true),
  ('arqo_config',           'Arqo · Configurações',     'Parametrização do funil Arqo',       '/arqo/config',            true),
  ('nexa_agenda',           'Nexa · Agenda de Visitas', 'Agendamento de visitas',             '/nexa/agenda',            true),
  ('nexa_disponibilidade',  'Nexa · Disponibilidade',   'Mapa/lista de unidades disponíveis', '/nexa/disponibilidade',   true),
  ('nexa_contratos',        'Nexa · Contratos',         'Gestão de contratos',                '/nexa/contratos',         true),
  ('nexa_contratos_modelos','Nexa · Modelos',           'Modelos de contrato',                '/nexa/contratos/modelos', true),
  ('nexa_contratos_blocos', 'Nexa · Blocos de Texto',   'Blocos reutilizáveis',               '/nexa/contratos/blocos',  true),
  ('nexa_contratos_variaveis','Nexa · Variáveis',       'Variáveis de contrato',              '/nexa/contratos/variaveis', true)
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  route = EXCLUDED.route,
  is_active = true;

-- 2) Semear permissões por role (idempotente)
WITH mods AS (
  SELECT id, name FROM public.sistema_modules
  WHERE name IN (
    'arqo_roleta','arqo_leads','arqo_forecast','arqo_admin','arqo_config',
    'nexa_agenda','nexa_disponibilidade','nexa_contratos','nexa_contratos_modelos','nexa_contratos_blocos','nexa_contratos_variaveis'
  )
),
role_defs AS (
  SELECT r.id AS role_id, r.name AS role_name, m.id AS module_id, m.name AS module_name,
    CASE
      -- Gestores Arqo/Nexa: acesso total a tudo do seu grupo
      WHEN r.name IN ('arqo_admin','arqo_gestor') AND m.name LIKE 'arqo_%' THEN ARRAY[true,true,true,true]
      WHEN r.name IN ('nexa_admin','nexa_gestor') AND m.name LIKE 'nexa_%' THEN ARRAY[true,true,true,true]
      -- Consultor/Closer Arqo: operar leads + roleta + forecast, sem admin/config
      WHEN r.name IN ('arqo_consultor','arqo_closer') AND m.name IN ('arqo_roleta','arqo_leads','arqo_forecast') THEN ARRAY[true,true,true,false]
      -- Corretor Nexa: agenda, disponibilidade (view), contratos view
      WHEN r.name = 'nexa_corretor' AND m.name = 'nexa_agenda' THEN ARRAY[true,true,true,false]
      WHEN r.name = 'nexa_corretor' AND m.name = 'nexa_disponibilidade' THEN ARRAY[true,false,false,false]
      WHEN r.name = 'nexa_corretor' AND m.name = 'nexa_contratos' THEN ARRAY[true,false,false,false]
      ELSE NULL
    END AS perms
  FROM public.roles r CROSS JOIN mods m
  WHERE r.name IN ('arqo_admin','arqo_gestor','arqo_consultor','arqo_closer','nexa_admin','nexa_gestor','nexa_corretor')
)
INSERT INTO public.sistema_role_permissions (role_id, module_id, can_view, can_create, can_edit, can_delete, scope)
SELECT role_id, module_id, perms[1], perms[2], perms[3], perms[4], 'global'
FROM role_defs
WHERE perms IS NOT NULL
ON CONFLICT (role_id, module_id) DO UPDATE SET
  can_view = EXCLUDED.can_view,
  can_create = EXCLUDED.can_create,
  can_edit = EXCLUDED.can_edit,
  can_delete = EXCLUDED.can_delete;

-- 3) Desativar o módulo genérico legado "arqo"/"nexa" se existir, para não poluir a UI
UPDATE public.sistema_modules SET is_active = false WHERE name IN ('arqo','nexa');