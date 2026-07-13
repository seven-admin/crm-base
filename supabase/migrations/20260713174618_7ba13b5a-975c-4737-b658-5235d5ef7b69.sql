-- Remove usuários do auth que não possuem role atribuída em user_roles
-- Também remove profiles órfãos correspondentes
DELETE FROM public.profiles p
WHERE NOT EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = p.id);

DELETE FROM auth.users au
WHERE NOT EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = au.id);