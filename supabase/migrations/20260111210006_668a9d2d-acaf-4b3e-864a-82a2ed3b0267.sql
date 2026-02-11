-- Add category column to modules table for grouping
ALTER TABLE public.modules ADD COLUMN IF NOT EXISTS category TEXT;

-- Update modules with their categories
UPDATE public.modules SET category = 'comercial' WHERE name IN ('negociacoes', 'clientes', 'forecast', 'propostas');
UPDATE public.modules SET category = 'empreendimentos' WHERE name IN ('empreendimentos', 'unidades', 'contratos', 'mapa_unidades');
UPDATE public.modules SET category = 'marketing' WHERE name IN ('projetos_marketing', 'briefings', 'eventos', 'tickets_marketing');
UPDATE public.modules SET category = 'administrativo' WHERE name IN ('usuarios', 'configuracoes', 'auditoria', 'agenda', 'atividades');
UPDATE public.modules SET category = 'portal' WHERE name IN ('portal_corretor', 'portal_cliente');
UPDATE public.modules SET category = 'financeiro' WHERE name IN ('comissoes', 'relatorios', 'financeiro', 'bonificacoes', 'dre');
UPDATE public.modules SET category = 'mercado' WHERE name IN ('corretores', 'imobiliarias');

-- Set default category for any uncategorized modules
UPDATE public.modules SET category = 'outros' WHERE category IS NULL;

-- Add indexes for better performance on permission queries
CREATE INDEX IF NOT EXISTS idx_user_module_permissions_user_id ON public.user_module_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON public.role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_module_id ON public.role_permissions(module_id);
CREATE INDEX IF NOT EXISTS idx_user_empreendimentos_user_id ON public.user_empreendimentos(user_id);
CREATE INDEX IF NOT EXISTS idx_modules_category ON public.modules(category);