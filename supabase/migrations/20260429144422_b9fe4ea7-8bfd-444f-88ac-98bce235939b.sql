-- 1. Limpar role duplicado da Aline (manter gestor_produto, remover corretor)
DELETE FROM public.user_roles
WHERE user_id = 'ff846b8c-c5b5-47c2-8350-4b136680f356'
  AND role_id = (SELECT id FROM public.roles WHERE name = 'corretor');

-- 2. Garantir que não existam outros duplicados no banco antes de aplicar a constraint.
-- Para qualquer usuário com >1 role, manter apenas o mais recente.
DELETE FROM public.user_roles ur
WHERE ur.id NOT IN (
  SELECT DISTINCT ON (user_id) id
  FROM public.user_roles
  ORDER BY user_id, created_at DESC
);

-- 3. Adicionar constraint UNIQUE para impedir múltiplos roles por usuário no futuro.
ALTER TABLE public.user_roles
  ADD CONSTRAINT user_roles_user_id_unique UNIQUE (user_id);