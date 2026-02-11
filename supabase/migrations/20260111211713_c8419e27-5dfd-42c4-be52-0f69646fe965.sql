-- =====================================================
-- FASE 1: Inserir novos módulos com granularidade adequada
-- =====================================================

-- Contratos - Subdivisões
INSERT INTO public.modules (name, display_name, description, category, route, is_active) VALUES
('contratos_templates', 'Templates de Contrato', 'Gerenciar modelos/templates de contrato', 'contratos', '/contratos?tab=templates', true),
('contratos_variaveis', 'Variáveis de Contrato', 'Configurar variáveis para substituição em templates', 'contratos', '/contratos?tab=variaveis', true),
('contratos_tipos_parcela', 'Tipos de Parcela', 'Configurar tipos de parcela para condições de pagamento', 'contratos', '/tipos-parcela', true)
ON CONFLICT (name) DO NOTHING;

-- Comercial - Subdivisões
INSERT INTO public.modules (name, display_name, description, category, route, is_active) VALUES
('negociacoes_config', 'Configurar Pipeline', 'Configurar etapas e funis do pipeline de negociação', 'comercial', '/configuracoes/negociacoes', true),
('propostas', 'Propostas', 'Gestão de propostas comerciais enviadas aos clientes', 'comercial', '/propostas', true),
('solicitacoes', 'Solicitações', 'Solicitações de reserva e aprovação de unidades', 'comercial', '/solicitacoes', true)
ON CONFLICT (name) DO NOTHING;

-- Empreendimentos - Subdivisões
INSERT INTO public.modules (name, display_name, description, category, route, is_active) VALUES
('empreendimentos_config', 'Config. Comercial Empreend.', 'Configurar parâmetros comerciais do empreendimento', 'empreendimentos', NULL, true),
('empreendimentos_comissoes', 'Config. Comissões Empreend.', 'Configurar regras de comissão do empreendimento', 'empreendimentos', NULL, true)
ON CONFLICT (name) DO NOTHING;

-- Marketing - Subdivisões
INSERT INTO public.modules (name, display_name, description, category, route, is_active) VALUES
('projetos_marketing_config', 'Config. Workflow Marketing', 'Configurar etapas do workflow de tickets', 'marketing', '/marketing/etapas', true),
('eventos_templates', 'Templates de Evento', 'Gerenciar templates/modelos de eventos', 'marketing', '/eventos/templates', true)
ON CONFLICT (name) DO NOTHING;

-- Financeiro - Subdivisões
INSERT INTO public.modules (name, display_name, description, category, route, is_active) VALUES
('bonificacoes', 'Bonificações', 'Gestão de bonificações por desempenho', 'financeiro', '/bonificacoes', true),
('financeiro_fluxo', 'Fluxo de Caixa', 'Gestão do fluxo de caixa e lançamentos', 'financeiro', '/financeiro', true),
('financeiro_dre', 'DRE', 'Demonstrativo de Resultados do Exercício', 'financeiro', '/dre', true)
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- FASE 2: Atualizar display_name, description e category dos módulos existentes
-- =====================================================

UPDATE public.modules SET 
  display_name = 'Gestão de Contratos',
  description = 'Visualizar, criar e gerenciar contratos de venda',
  category = 'contratos'
WHERE name = 'contratos';

UPDATE public.modules SET 
  display_name = 'Pipeline de Negociações',
  description = 'Gerenciar negociações no kanban/pipeline de vendas',
  category = 'comercial'
WHERE name = 'negociacoes';

UPDATE public.modules SET 
  display_name = 'Cadastro de Clientes',
  description = 'Gerenciar cadastro e informações de clientes',
  category = 'comercial'
WHERE name = 'clientes';

UPDATE public.modules SET 
  display_name = 'Agenda de Atividades',
  description = 'Gerenciar atividades, visitas e follow-ups',
  category = 'comercial'
WHERE name = 'atividades';

UPDATE public.modules SET 
  display_name = 'Forecast de Vendas',
  description = 'Visualizar previsão e análise de vendas',
  category = 'comercial'
WHERE name = 'forecast';

UPDATE public.modules SET 
  display_name = 'Cadastro de Empreendimentos',
  description = 'Gerenciar empreendimentos e suas informações',
  category = 'empreendimentos'
WHERE name = 'empreendimentos';

UPDATE public.modules SET 
  display_name = 'Mapa de Unidades',
  description = 'Visualizar e gerenciar mapa interativo de unidades',
  category = 'empreendimentos'
WHERE name = 'mapa_unidades';

UPDATE public.modules SET 
  display_name = 'Gestão de Comissões',
  description = 'Gerenciar comissões de corretores e imobiliárias',
  category = 'financeiro'
WHERE name = 'comissoes';

UPDATE public.modules SET 
  display_name = 'Metas Comerciais',
  description = 'Definir e acompanhar metas de vendas',
  category = 'comercial'
WHERE name = 'metas';

UPDATE public.modules SET 
  display_name = 'Cadastro de Imobiliárias',
  description = 'Gerenciar cadastro de imobiliárias parceiras',
  category = 'mercado'
WHERE name = 'imobiliarias';

UPDATE public.modules SET 
  display_name = 'Cadastro de Corretores',
  description = 'Gerenciar cadastro de corretores',
  category = 'mercado'
WHERE name = 'corretores';

UPDATE public.modules SET 
  display_name = 'Gestão de Usuários',
  description = 'Gerenciar usuários, perfis e permissões do sistema',
  category = 'administrativo'
WHERE name = 'usuarios';

UPDATE public.modules SET 
  display_name = 'Configurações do Sistema',
  description = 'Configurações gerais e termos de uso',
  category = 'administrativo'
WHERE name = 'configuracoes';

UPDATE public.modules SET 
  display_name = 'Logs de Auditoria',
  description = 'Visualizar histórico de ações no sistema',
  category = 'administrativo'
WHERE name = 'auditoria';

UPDATE public.modules SET 
  display_name = 'Relatórios Gerenciais',
  description = 'Gerar e visualizar relatórios do sistema',
  category = 'administrativo'
WHERE name = 'relatorios';

UPDATE public.modules SET 
  display_name = 'Dashboard Executivo',
  description = 'Visão consolidada de indicadores do negócio',
  category = 'administrativo'
WHERE name = 'dashboard_executivo';

UPDATE public.modules SET 
  display_name = 'Projetos de Marketing',
  description = 'Gerenciar projetos e tickets de marketing',
  category = 'marketing'
WHERE name = 'projetos_marketing';

UPDATE public.modules SET 
  display_name = 'Briefings de Marketing',
  description = 'Gerenciar briefings de campanhas e materiais',
  category = 'marketing'
WHERE name = 'briefings';

UPDATE public.modules SET 
  display_name = 'Gestão de Eventos',
  description = 'Gerenciar eventos e ações promocionais',
  category = 'marketing'
WHERE name = 'eventos';

UPDATE public.modules SET 
  display_name = 'Portal do Corretor',
  description = 'Acesso ao portal de corretores',
  category = 'portal'
WHERE name = 'portal_corretor';

UPDATE public.modules SET 
  display_name = 'Simulador de Financiamento',
  description = 'Simular condições de financiamento para clientes',
  category = 'comercial'
WHERE name = 'simulador';

-- =====================================================
-- FASE 3: Copiar permissões existentes para novos módulos (incluindo role obrigatório)
-- =====================================================

-- Copiar permissões de 'contratos' para os novos módulos de contratos
INSERT INTO public.role_permissions (role, role_id, module_id, can_view, can_create, can_edit, can_delete, scope)
SELECT 
  rp.role,
  rp.role_id,
  m.id as module_id,
  rp.can_view,
  rp.can_create,
  rp.can_edit,
  rp.can_delete,
  rp.scope
FROM public.role_permissions rp
JOIN public.modules parent ON parent.id = rp.module_id AND parent.name = 'contratos'
CROSS JOIN public.modules m
WHERE m.name IN ('contratos_templates', 'contratos_variaveis', 'contratos_tipos_parcela')
ON CONFLICT (role_id, module_id) DO NOTHING;

-- Copiar permissões de 'negociacoes' para novos módulos comerciais
INSERT INTO public.role_permissions (role, role_id, module_id, can_view, can_create, can_edit, can_delete, scope)
SELECT 
  rp.role,
  rp.role_id,
  m.id as module_id,
  rp.can_view,
  rp.can_create,
  rp.can_edit,
  rp.can_delete,
  rp.scope
FROM public.role_permissions rp
JOIN public.modules parent ON parent.id = rp.module_id AND parent.name = 'negociacoes'
CROSS JOIN public.modules m
WHERE m.name IN ('negociacoes_config', 'propostas', 'solicitacoes')
ON CONFLICT (role_id, module_id) DO NOTHING;

-- Copiar permissões de 'empreendimentos' para config
INSERT INTO public.role_permissions (role, role_id, module_id, can_view, can_create, can_edit, can_delete, scope)
SELECT 
  rp.role,
  rp.role_id,
  m.id as module_id,
  rp.can_view,
  rp.can_create,
  rp.can_edit,
  rp.can_delete,
  rp.scope
FROM public.role_permissions rp
JOIN public.modules parent ON parent.id = rp.module_id AND parent.name = 'empreendimentos'
CROSS JOIN public.modules m
WHERE m.name IN ('empreendimentos_config', 'empreendimentos_comissoes')
ON CONFLICT (role_id, module_id) DO NOTHING;

-- Copiar permissões de 'projetos_marketing' para config
INSERT INTO public.role_permissions (role, role_id, module_id, can_view, can_create, can_edit, can_delete, scope)
SELECT 
  rp.role,
  rp.role_id,
  m.id as module_id,
  rp.can_view,
  rp.can_create,
  rp.can_edit,
  rp.can_delete,
  rp.scope
FROM public.role_permissions rp
JOIN public.modules parent ON parent.id = rp.module_id AND parent.name = 'projetos_marketing'
CROSS JOIN public.modules m
WHERE m.name = 'projetos_marketing_config'
ON CONFLICT (role_id, module_id) DO NOTHING;

-- Copiar permissões de 'eventos' para templates
INSERT INTO public.role_permissions (role, role_id, module_id, can_view, can_create, can_edit, can_delete, scope)
SELECT 
  rp.role,
  rp.role_id,
  m.id as module_id,
  rp.can_view,
  rp.can_create,
  rp.can_edit,
  rp.can_delete,
  rp.scope
FROM public.role_permissions rp
JOIN public.modules parent ON parent.id = rp.module_id AND parent.name = 'eventos'
CROSS JOIN public.modules m
WHERE m.name = 'eventos_templates'
ON CONFLICT (role_id, module_id) DO NOTHING;

-- Copiar permissões de 'comissoes' para financeiro
INSERT INTO public.role_permissions (role, role_id, module_id, can_view, can_create, can_edit, can_delete, scope)
SELECT 
  rp.role,
  rp.role_id,
  m.id as module_id,
  rp.can_view,
  rp.can_create,
  rp.can_edit,
  rp.can_delete,
  rp.scope
FROM public.role_permissions rp
JOIN public.modules parent ON parent.id = rp.module_id AND parent.name = 'comissoes'
CROSS JOIN public.modules m
WHERE m.name IN ('bonificacoes', 'financeiro_fluxo', 'financeiro_dre')
ON CONFLICT (role_id, module_id) DO NOTHING;

-- =====================================================
-- FASE 4: Desativar módulo legado config_negociacoes
-- =====================================================

UPDATE public.modules SET is_active = false WHERE name = 'config_negociacoes';