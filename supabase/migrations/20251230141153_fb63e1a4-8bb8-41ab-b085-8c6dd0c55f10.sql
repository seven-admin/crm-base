-- Atribuir role de Admin ao usuário administrativo@sevengroup360.com.br
INSERT INTO public.user_roles (user_id, role)
VALUES ('6e46fe54-59ae-4f1c-96f9-c48bb930d444', 'admin');

-- Atualizar nome do perfil para Administrador
UPDATE public.profiles 
SET full_name = 'Administrador'
WHERE id = '6e46fe54-59ae-4f1c-96f9-c48bb930d444';