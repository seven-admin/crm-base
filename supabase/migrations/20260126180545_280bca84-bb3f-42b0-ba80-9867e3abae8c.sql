-- Atualizar função is_marketing_supervisor para incluir diretor_de_marketing
CREATE OR REPLACE FUNCTION public.is_marketing_supervisor(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.user_roles ur
    JOIN public.roles r ON r.id = ur.role_id
    WHERE ur.user_id = _user_id
    AND r.name IN (
      'supervisor_relacionamento', 
      'supervisor_render', 
      'supervisor_criacao', 
      'supervisor_video', 
      'equipe_marketing',
      'diretor_de_marketing'
    )
    AND r.is_active = true
  )
$$;