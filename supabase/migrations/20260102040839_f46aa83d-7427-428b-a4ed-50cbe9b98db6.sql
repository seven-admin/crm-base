-- Update modules table to reflect new naming
UPDATE modules SET 
  display_name = 'Negociações',
  description = 'Gestão de negociações em formato Kanban',
  route = '/negociacoes'
WHERE name = 'funil';

UPDATE modules SET 
  display_name = 'Configuração de Negociações',
  description = 'Gerenciamento de pipelines e etapas de negociação',
  route = '/configuracoes/negociacoes'
WHERE name = 'config_funis';