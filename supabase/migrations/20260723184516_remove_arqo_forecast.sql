-- O forecast comercial foi removido da interface da Arqo.
-- Mantemos o registro e as permissões históricas, mas o módulo inativo deixa
-- de ser oferecido na administração de perfis e nas verificações de acesso.
UPDATE public.sistema_modules
SET is_active = false
WHERE name = 'arqo_forecast';
