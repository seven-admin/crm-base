-- Permitir role NULL para roles dinâmicos (não existentes no enum legado)
ALTER TABLE public.role_permissions 
ALTER COLUMN role DROP NOT NULL;