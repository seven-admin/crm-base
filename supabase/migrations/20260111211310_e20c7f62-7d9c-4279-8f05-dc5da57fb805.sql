-- Adicionar constraint UNIQUE na coluna name da tabela modules
ALTER TABLE public.modules ADD CONSTRAINT modules_name_unique UNIQUE (name);

-- Adicionar constraint UNIQUE composta para role_permissions
ALTER TABLE public.role_permissions ADD CONSTRAINT role_permissions_role_module_unique UNIQUE (role_id, module_id);