-- Tabela para permissões individuais por usuário (sobrescreve role_permissions)
CREATE TABLE public.user_module_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  can_view BOOLEAN NOT NULL DEFAULT false,
  can_create BOOLEAN NOT NULL DEFAULT false,
  can_edit BOOLEAN NOT NULL DEFAULT false,
  can_delete BOOLEAN NOT NULL DEFAULT false,
  scope TEXT NOT NULL DEFAULT 'proprio',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(user_id, module_id)
);

-- Enable RLS
ALTER TABLE public.user_module_permissions ENABLE ROW LEVEL SECURITY;

-- Trigger para atualizar updated_at
CREATE TRIGGER update_user_module_permissions_updated_at
  BEFORE UPDATE ON public.user_module_permissions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Função para verificar se usuário tem permissão customizada para um módulo
CREATE OR REPLACE FUNCTION public.get_user_module_permission(_user_id uuid, _module_name text)
RETURNS TABLE(can_view boolean, can_create boolean, can_edit boolean, can_delete boolean, scope text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ump.can_view, ump.can_create, ump.can_edit, ump.can_delete, ump.scope
  FROM public.user_module_permissions ump
  JOIN public.modules m ON m.id = ump.module_id
  WHERE ump.user_id = _user_id
    AND m.name = _module_name
  LIMIT 1
$$;

-- Função atualizada para verificar permissão (prioriza custom sobre role)
CREATE OR REPLACE FUNCTION public.can_access_module_v2(_user_id uuid, _module_name text, _action text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _custom_perm RECORD;
  _role_perm RECORD;
BEGIN
  -- Admin tem acesso total
  IF public.is_admin(_user_id) THEN
    RETURN true;
  END IF;

  -- Primeiro verifica permissões customizadas do usuário
  SELECT ump.can_view, ump.can_create, ump.can_edit, ump.can_delete
  INTO _custom_perm
  FROM public.user_module_permissions ump
  JOIN public.modules m ON m.id = ump.module_id
  WHERE ump.user_id = _user_id
    AND m.name = _module_name
    AND m.is_active = true;

  -- Se encontrou permissão customizada, usa ela
  IF FOUND THEN
    RETURN CASE _action
      WHEN 'view' THEN _custom_perm.can_view
      WHEN 'create' THEN _custom_perm.can_create
      WHEN 'edit' THEN _custom_perm.can_edit
      WHEN 'delete' THEN _custom_perm.can_delete
      ELSE false
    END;
  END IF;

  -- Senão, usa permissão do role
  SELECT rp.can_view, rp.can_create, rp.can_edit, rp.can_delete
  INTO _role_perm
  FROM public.role_permissions rp
  JOIN public.modules m ON m.id = rp.module_id
  JOIN public.user_roles ur ON ur.role = rp.role
  WHERE ur.user_id = _user_id
    AND m.name = _module_name
    AND m.is_active = true;

  IF FOUND THEN
    RETURN CASE _action
      WHEN 'view' THEN _role_perm.can_view
      WHEN 'create' THEN _role_perm.can_create
      WHEN 'edit' THEN _role_perm.can_edit
      WHEN 'delete' THEN _role_perm.can_delete
      ELSE false
    END;
  END IF;

  RETURN false;
END;
$$;

-- RLS Policies

-- Admins podem gerenciar todas as permissões
CREATE POLICY "Admins can manage user_module_permissions"
ON public.user_module_permissions
FOR ALL
USING (public.is_admin(auth.uid()));

-- Gestores podem gerenciar permissões
CREATE POLICY "Gestores can manage user_module_permissions"
ON public.user_module_permissions
FOR ALL
USING (public.has_role(auth.uid(), 'gestor_produto'));

-- Usuários podem ver suas próprias permissões
CREATE POLICY "Users can view own permissions"
ON public.user_module_permissions
FOR SELECT
USING (user_id = auth.uid());