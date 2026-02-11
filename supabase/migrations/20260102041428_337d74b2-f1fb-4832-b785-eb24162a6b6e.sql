-- FASE 1: Limpeza e correção do banco

-- 1. Deletar role_permissions dos módulos que serão removidos
DELETE FROM role_permissions 
WHERE module_id IN (
  SELECT id FROM modules WHERE name IN ('abertura_mercado', 'leads')
);

-- 2. Deletar user_module_permissions dos módulos que serão removidos
DELETE FROM user_module_permissions 
WHERE module_id IN (
  SELECT id FROM modules WHERE name IN ('abertura_mercado', 'leads')
);

-- 3. Deletar os módulos obsoletos
DELETE FROM modules WHERE name IN ('abertura_mercado', 'leads');

-- 4. Renomear corretamente os módulos de Funil (name, não só display_name)
UPDATE modules SET 
  name = 'negociacoes',
  display_name = 'Negociações',
  description = 'Gestão de negociações em formato Kanban',
  route = '/negociacoes'
WHERE name = 'funil';

UPDATE modules SET 
  name = 'config_negociacoes',
  display_name = 'Configuração de Negociações',
  description = 'Gerenciamento de pipelines e etapas de negociação',
  route = '/configuracoes/negociacoes'
WHERE name = 'config_funis';