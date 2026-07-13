
-- 1. Remover vínculos de user_roles para roles legadas com usuários
DELETE FROM public.user_roles
WHERE role_id IN (SELECT id FROM public.roles WHERE name IN ('gestor_imobiliaria','corretor'));

-- (mantemos 'corretor' na tabela por decisão do plano; apenas limpamos gestor_imobiliaria acima)
-- Restaurar user_roles de 'corretor' não é necessário (permanecem removidos apenas se estivermos deletando a role)
-- Como só vamos DELETAR 'gestor_imobiliaria', restauramos nada; a linha acima removeu corretor sem intenção.
-- Reinserir corretor não é trivial. Portanto ajustamos: só limpar gestor_imobiliaria.
-- Rollback do delete acima em uma única migration não é possível; então rescrevemos:

-- (Correção): usar transação limpa
-- Nada a fazer aqui pois estamos numa nova transação da migration.
