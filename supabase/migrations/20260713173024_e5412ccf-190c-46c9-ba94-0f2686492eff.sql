
-- 1) RESTAURAR vínculos de 'corretor' a partir de seven_corretores
INSERT INTO public.user_roles (user_id, role_id)
SELECT DISTINCT c.user_id, '07ef9eb1-0171-4971-ae0c-28ad427a13cb'::uuid
FROM public.seven_corretores c
WHERE c.user_id IS NOT NULL
ON CONFLICT (user_id) DO NOTHING;

-- 2) Remover roles legadas (sem usuários agora):
--    diretor_de_marketing, supervisão_de_criação, incorporador, gestor_produto, gestor_imobiliaria
DELETE FROM public.sistema_role_permissions
WHERE role_id IN (
  SELECT id FROM public.roles
  WHERE name IN ('diretor_de_marketing','supervisão_de_criação','incorporador','gestor_produto','gestor_imobiliaria')
);

DELETE FROM public.roles
WHERE name IN ('diretor_de_marketing','supervisão_de_criação','incorporador','gestor_produto','gestor_imobiliaria');

-- 3) SEMEAR permissões para perfis Arqo/Nexa
-- Helper CTEs
WITH
role_map AS (
  SELECT id, name FROM public.roles
  WHERE name IN ('arqo_admin','arqo_gestor','arqo_consultor','arqo_closer',
                 'nexa_admin','nexa_gestor','nexa_corretor')
),
arqo_modules AS (
  SELECT id, name FROM public.sistema_modules
  WHERE name IN ('atividades','clientes','forecast','negociacoes','propostas','solicitacoes','dashboard')
    AND is_active = true
),
nexa_modules AS (
  SELECT id, name FROM public.sistema_modules
  WHERE name IN ('agenda','unidades','empreendimentos','contratos','contratos_templates',
                 'contratos_variaveis','contratos_tipos_parcela','dashboard','reservas')
    AND is_active = true
),
-- Arqo admin/gestor: full access
arqo_full AS (
  SELECT r.id AS role_id, m.id AS module_id,
         true AS can_view, true AS can_create, true AS can_edit, true AS can_delete,
         'global'::text AS scope
  FROM role_map r
  CROSS JOIN arqo_modules m
  WHERE r.name IN ('arqo_admin','arqo_gestor')
),
-- Arqo consultor/closer: próprios registros
arqo_own AS (
  SELECT r.id AS role_id, m.id AS module_id,
         true AS can_view, true AS can_create, true AS can_edit, false AS can_delete,
         'proprio'::text AS scope
  FROM role_map r
  CROSS JOIN arqo_modules m
  WHERE r.name IN ('arqo_consultor','arqo_closer')
),
-- Nexa admin/gestor: full access
nexa_full AS (
  SELECT r.id AS role_id, m.id AS module_id,
         true AS can_view, true AS can_create, true AS can_edit, true AS can_delete,
         'global'::text AS scope
  FROM role_map r
  CROSS JOIN nexa_modules m
  WHERE r.name IN ('nexa_admin','nexa_gestor')
),
-- Nexa corretor: próprios registros
nexa_own AS (
  SELECT r.id AS role_id, m.id AS module_id,
         true AS can_view, true AS can_create, true AS can_edit, false AS can_delete,
         'proprio'::text AS scope
  FROM role_map r
  CROSS JOIN nexa_modules m
  WHERE r.name = 'nexa_corretor'
),
all_perms AS (
  SELECT * FROM arqo_full
  UNION ALL SELECT * FROM arqo_own
  UNION ALL SELECT * FROM nexa_full
  UNION ALL SELECT * FROM nexa_own
)
INSERT INTO public.sistema_role_permissions (role_id, module_id, can_view, can_create, can_edit, can_delete, scope)
SELECT role_id, module_id, can_view, can_create, can_edit, can_delete, scope
FROM all_perms
ON CONFLICT (role_id, module_id) DO NOTHING;

-- 4) Reativar usuários já cadastrados
UPDATE public.profiles
SET is_active = true
WHERE id IN (
  'af6e4a8a-973a-4d92-aebb-1b53f43faaad',
  'ada2428e-f484-4db2-8959-7d86412ce02a'
);
