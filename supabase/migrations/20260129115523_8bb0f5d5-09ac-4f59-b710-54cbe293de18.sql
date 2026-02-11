-- Etapa 1: Atualizar função is_marketing_supervisor() para incluir novos roles
CREATE OR REPLACE FUNCTION public.is_marketing_supervisor(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.user_roles ur
    JOIN public.roles r ON r.id = ur.role_id
    WHERE ur.user_id = _user_id
    AND r.name IN (
      -- Nomes legados (compatibilidade)
      'supervisor_relacionamento', 
      'supervisor_render', 
      'supervisor_criacao', 
      'supervisor_video', 
      'equipe_marketing',
      'diretor_de_marketing',
      -- Novos nomes dinâmicos (criados via interface)
      'supervisão_de_criação',
      'supervisão_de_render',
      'supervisão_de_vídeo',
      'supervisão_de_relacionamento'
    )
    AND r.is_active = true
  )
$$;

-- Etapa 2: Inserir permissões para os roles de marketing nos módulos corretos
INSERT INTO public.role_permissions (role_id, module_id, can_view, can_create, can_edit, can_delete, scope)
SELECT 
  r.id as role_id,
  m.id as module_id,
  true as can_view,
  true as can_create,
  true as can_edit,
  true as can_delete,
  'global' as scope
FROM public.roles r
CROSS JOIN public.modules m
WHERE r.name IN ('supervisão_de_criação', 'diretor_de_marketing')
  AND m.name IN ('projetos_marketing', 'eventos', 'briefings', 'relatorios')
  AND m.is_active = true
  AND r.is_active = true
ON CONFLICT DO NOTHING;