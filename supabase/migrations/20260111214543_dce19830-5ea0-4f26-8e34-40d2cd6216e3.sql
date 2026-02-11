-- Passo 1: Atualizar função RLS para dar acesso global ao Corretor
CREATE OR REPLACE FUNCTION public.user_has_empreendimento_access(_user_id uuid, _empreendimento_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    public.is_admin(_user_id) 
    OR public.has_role(_user_id, 'gestor_produto')
    -- Corretor agora tem acesso global de visualização a todos empreendimentos
    OR public.has_role(_user_id, 'corretor')
    OR EXISTS (
      SELECT 1 FROM public.user_empreendimentos
      WHERE user_id = _user_id 
        AND empreendimento_id = _empreendimento_id
    )
$$;

-- Passo 2: Atualizar permissões do corretor para empreendimentos (acesso global de visualização)
UPDATE public.role_permissions
SET 
  scope = 'global',
  can_view = true,
  can_create = false,
  can_edit = false,
  can_delete = false
WHERE role_id = (SELECT id FROM public.roles WHERE name = 'corretor')
  AND module_id = (SELECT id FROM public.modules WHERE name = 'empreendimentos');