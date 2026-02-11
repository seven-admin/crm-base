-- PARTE 2: Atualizar funções para usar nova tabela roles

-- Dropar função get_user_role que retorna app_role
DROP FUNCTION IF EXISTS public.get_user_role(uuid);

-- Recriar has_role para usar nova tabela
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.roles r ON r.id = ur.role_id
    WHERE ur.user_id = _user_id
      AND r.name = _role
      AND r.is_active = true
  )
$$;

-- Criar função get_user_role que retorna text
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT r.name 
  FROM public.user_roles ur
  JOIN public.roles r ON r.id = ur.role_id
  WHERE ur.user_id = _user_id
  LIMIT 1
$$;

-- Criar função has_role_by_id
CREATE OR REPLACE FUNCTION public.has_role_by_id(_user_id uuid, _role_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.roles r ON r.id = ur.role_id
    WHERE ur.user_id = _user_id
      AND ur.role_id = _role_id
      AND r.is_active = true
  )
$$;

-- Atualizar is_admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'admin') 
      OR public.has_role(_user_id, 'super_admin')
$$;

-- Atualizar is_super_admin
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'super_admin')
$$;

-- Atualizar is_seven_team
CREATE OR REPLACE FUNCTION public.is_seven_team(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.roles r ON r.id = ur.role_id
    WHERE ur.user_id = _user_id
      AND r.name NOT IN ('incorporador', 'corretor', 'cliente_externo')
      AND r.is_active = true
  )
$$;

-- Atualizar is_marketing_supervisor
CREATE OR REPLACE FUNCTION public.is_marketing_supervisor(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.user_roles ur
    JOIN public.roles r ON r.id = ur.role_id
    WHERE ur.user_id = _user_id
    AND r.name IN ('supervisor_relacionamento', 'supervisor_render', 'supervisor_criacao', 'supervisor_video', 'equipe_marketing')
    AND r.is_active = true
  )
$$;

-- Atualizar is_cliente_externo
CREATE OR REPLACE FUNCTION public.is_cliente_externo(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'cliente_externo')
$$;

-- Criar função para obter role_id por nome
CREATE OR REPLACE FUNCTION public.get_role_id(_role_name text)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.roles WHERE name = _role_name LIMIT 1
$$;

-- Limpar módulo propostas
DELETE FROM role_permissions WHERE module_id IN (SELECT id FROM modules WHERE name = 'propostas');
DELETE FROM user_module_permissions WHERE module_id IN (SELECT id FROM modules WHERE name = 'propostas');
DELETE FROM modules WHERE name = 'propostas';