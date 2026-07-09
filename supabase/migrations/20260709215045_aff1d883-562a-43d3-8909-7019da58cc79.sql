
-- 1) Adicionar coluna empresa em profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS empresa TEXT NOT NULL DEFAULT 'seven'
  CHECK (empresa IN ('seven','arqo','nexa','incorporador','externo'));

-- 2) Backfill baseado no role atual
UPDATE public.profiles p
SET empresa = CASE
  WHEN r.name LIKE 'arqo_%' THEN 'arqo'
  WHEN r.name LIKE 'nexa_%' THEN 'nexa'
  WHEN r.name = 'incorporador' THEN 'incorporador'
  WHEN r.name = 'cliente_externo' THEN 'externo'
  ELSE 'seven'
END
FROM public.user_roles ur
JOIN public.roles r ON r.id = ur.role_id
WHERE ur.user_id = p.id;

-- 3) Helper para consultar a empresa do usuário
CREATE OR REPLACE FUNCTION public.get_user_empresa(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT empresa FROM public.profiles WHERE id = _user_id LIMIT 1
$$;

-- 4) Remover tabelas de aceite de termos (não são usadas no frontend)
DROP TABLE IF EXISTS public.termos_aceites CASCADE;
DROP TABLE IF EXISTS public.termos_versoes CASCADE;
