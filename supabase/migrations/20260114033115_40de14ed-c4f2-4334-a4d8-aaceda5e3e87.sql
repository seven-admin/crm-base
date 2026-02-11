-- Atualizar nomes e descrições dos módulos para maior clareza

-- Comercial
UPDATE modules SET 
  display_name = 'Minha Agenda',
  description = 'Visualizar agenda pessoal de compromissos e tarefas do usuário'
WHERE name = 'agenda';

UPDATE modules SET 
  display_name = 'Follow-ups e Visitas',
  description = 'Registrar e acompanhar atividades comerciais com clientes (ligações, visitas, reuniões)'
WHERE name = 'atividades';

UPDATE modules SET 
  display_name = 'Previsão de Vendas',
  description = 'Dashboard de forecast com funil de temperatura, métricas e projeções de fechamento'
WHERE name = 'forecast';

UPDATE modules SET 
  display_name = 'Pipeline de Vendas',
  description = 'Kanban de negociações em andamento, acompanhamento de leads e oportunidades'
WHERE name = 'negociacoes';

UPDATE modules SET 
  display_name = 'Configurar Pipeline',
  description = 'Criar e editar etapas, funis e regras do pipeline de vendas'
WHERE name = 'negociacoes_config';

UPDATE modules SET 
  display_name = 'Cadastro de Clientes',
  description = 'Gerenciar cadastro completo de clientes, leads e contatos'
WHERE name = 'clientes';

UPDATE modules SET 
  display_name = 'Propostas Comerciais',
  description = 'Criar e gerenciar propostas de venda para clientes'
WHERE name = 'propostas';

-- Empreendimentos
UPDATE modules SET 
  display_name = 'Empreendimentos',
  description = 'Visualizar e gerenciar empreendimentos, unidades e informações gerais'
WHERE name = 'empreendimentos';

UPDATE modules SET 
  display_name = 'Tabela de Preços',
  description = 'Configurar parâmetros comerciais, valores de m², descontos e condições de pagamento'
WHERE name = 'empreendimentos_config';

UPDATE modules SET 
  display_name = 'Regras de Comissão',
  description = 'Definir percentuais e regras de comissão por empreendimento'
WHERE name = 'empreendimentos_comissoes';

UPDATE modules SET 
  display_name = 'Mapa de Unidades',
  description = 'Visualizar e interagir com o mapa gráfico de disponibilidade das unidades'
WHERE name = 'mapa_unidades';

-- Contratos
UPDATE modules SET 
  display_name = 'Gestão de Contratos',
  description = 'Criar, visualizar e gerenciar contratos de venda e documentação'
WHERE name = 'contratos';

UPDATE modules SET 
  display_name = 'Modelos de Contrato',
  description = 'Criar e editar templates/modelos de contratos com variáveis dinâmicas'
WHERE name = 'contratos_templates';

UPDATE modules SET 
  display_name = 'Variáveis de Contrato',
  description = 'Configurar campos dinâmicos disponíveis para uso nos templates de contrato'
WHERE name = 'contratos_variaveis';

UPDATE modules SET 
  display_name = 'Tipos de Parcela',
  description = 'Configurar tipos de parcela (entrada, sinal, balão, mensais, anuais, etc.)'
WHERE name = 'contratos_tipos_parcela';

-- Financeiro
UPDATE modules SET 
  display_name = 'Comissões',
  description = 'Gerenciar pagamentos de comissões para corretores e imobiliárias'
WHERE name = 'comissoes';

UPDATE modules SET 
  display_name = 'DRE (Resultados)',
  description = 'Demonstrativo de Resultados do Exercício - análise de receitas e despesas'
WHERE name = 'financeiro_dre';

UPDATE modules SET 
  display_name = 'Fluxo de Caixa',
  description = 'Lançamentos financeiros, gestão de entradas e saídas de caixa'
WHERE name = 'financeiro_fluxo';

UPDATE modules SET 
  display_name = 'Bonificações',
  description = 'Gerenciar bonificações e premiações para equipe comercial'
WHERE name = 'bonificacoes';

-- Marketing
UPDATE modules SET 
  display_name = 'Solicitações Marketing',
  description = 'Criar e gerenciar tickets de demandas para o time de marketing'
WHERE name = 'marketing_tickets';

UPDATE modules SET 
  display_name = 'Projetos de Marketing',
  description = 'Acompanhar projetos, campanhas e entregas de marketing'
WHERE name = 'marketing_projetos';

UPDATE modules SET 
  display_name = 'Briefings',
  description = 'Criar e gerenciar briefings para peças de comunicação e materiais'
WHERE name = 'briefings';

UPDATE modules SET 
  display_name = 'Calendário de Eventos',
  description = 'Gerenciar eventos, lançamentos e ações promocionais'
WHERE name = 'eventos';

-- Mercado (Parceiros)
UPDATE modules SET 
  display_name = 'Corretores Parceiros',
  description = 'Gerenciar cadastro de corretores autônomos e parceiros comerciais'
WHERE name = 'corretores';

UPDATE modules SET 
  display_name = 'Imobiliárias Parceiras',
  description = 'Gerenciar cadastro de imobiliárias e parcerias comerciais'
WHERE name = 'imobiliarias';

UPDATE modules SET 
  display_name = 'Incorporadoras',
  description = 'Gerenciar cadastro de incorporadoras e desenvolvedores parceiros'
WHERE name = 'incorporadoras';

-- Administrativo
UPDATE modules SET 
  display_name = 'Usuários do Sistema',
  description = 'Gerenciar usuários, acessos e permissões de colaboradores internos'
WHERE name = 'usuarios';

UPDATE modules SET 
  display_name = 'Configurações Gerais',
  description = 'Configurações gerais do sistema, parâmetros e preferências'
WHERE name = 'configuracoes';

UPDATE modules SET 
  display_name = 'Logs de Auditoria',
  description = 'Visualizar histórico de ações e alterações realizadas no sistema'
WHERE name = 'auditoria';

UPDATE modules SET 
  display_name = 'Relatórios',
  description = 'Gerar e visualizar relatórios gerenciais e operacionais'
WHERE name = 'relatorios';

UPDATE modules SET 
  display_name = 'Dashboard Executivo',
  description = 'Painel consolidado com KPIs e indicadores de desempenho'
WHERE name = 'dashboard';

-- Portal
UPDATE modules SET 
  display_name = 'Portal do Corretor',
  description = 'Acesso ao portal externo para corretores e imobiliárias parceiras'
WHERE name = 'portal_corretor';

UPDATE modules SET 
  display_name = 'Portal do Cliente',
  description = 'Acesso ao portal externo para clientes acompanharem suas compras'
WHERE name = 'portal_cliente';

UPDATE modules SET 
  display_name = 'Solicitações Recebidas',
  description = 'Gerenciar solicitações de reserva e contato recebidas dos portais'
WHERE name = 'solicitacoes';