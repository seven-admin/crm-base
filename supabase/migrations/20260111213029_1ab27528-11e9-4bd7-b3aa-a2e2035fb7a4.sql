-- Passo 1: Excluir permissões dos perfis que serão removidos
DELETE FROM public.role_permissions
WHERE role_id IN (
  SELECT id FROM public.roles 
  WHERE name IN (
    'supervisor_relacionamento',
    'supervisor_render', 
    'supervisor_criacao',
    'supervisor_video',
    'equipe_marketing',
    'cliente_externo'
  )
);

-- Passo 2: Excluir os perfis
DELETE FROM public.roles 
WHERE name IN (
  'supervisor_relacionamento',
  'supervisor_render',
  'supervisor_criacao', 
  'supervisor_video',
  'equipe_marketing',
  'cliente_externo'
);

-- Passo 3: Renomear Incorporador para Contratante
UPDATE public.roles 
SET 
  display_name = 'Contratante',
  description = 'Perfil para contratantes e clientes do sistema',
  updated_at = now()
WHERE name = 'incorporador';