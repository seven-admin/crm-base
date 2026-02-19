
-- Passo 1: Corrigir a função has_role(uuid, text) para consultar AMBAS as colunas
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = _user_id
      AND (
        ur.role::text = _role
        OR EXISTS (
          SELECT 1 FROM public.roles r
          WHERE r.id = ur.role_id AND r.name = _role AND r.is_active = true
        )
      )
  )
$$;

-- Passo 2: Sincronizar coluna `role` (enum) para os usuários que têm role_id mas role = NULL
UPDATE public.user_roles ur
SET role = r.name::app_role
FROM public.roles r
WHERE ur.role_id = r.id
  AND ur.role IS NULL
  AND r.name IN (SELECT unnest(enum_range(NULL::app_role))::text);

-- Passo 3: Criar função e trigger para manter sincronizado automaticamente no futuro
CREATE OR REPLACE FUNCTION public.sync_user_role_enum()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_role_name text;
BEGIN
  IF NEW.role IS NULL AND NEW.role_id IS NOT NULL THEN
    SELECT name INTO v_role_name FROM public.roles WHERE id = NEW.role_id AND is_active = true;
    BEGIN
      NEW.role := v_role_name::app_role;
    EXCEPTION WHEN invalid_text_representation THEN
      -- role_name não existe no enum (ex: gestor_produto), mantém NULL
      NULL;
    END;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_user_role_enum ON public.user_roles;

CREATE TRIGGER trg_sync_user_role_enum
  BEFORE INSERT OR UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_user_role_enum();
