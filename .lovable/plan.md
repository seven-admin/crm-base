# Documento: `SISTEMA_PROMPTS.md` para recriação modular

## Objetivo

Criar um único arquivo `SISTEMA_PROMPTS.md` na raiz do projeto contendo uma sequência de prompts otimizados para o Lovable, que permitam recriar este sistema (CRM imobiliário multi-empreendimento) de forma incremental e modular, do zero.

## Por que prompts em sequência

O sistema atual tem ~60 páginas, ~109 hooks, ~95 tabelas Postgres e 12 edge functions. Construir tudo em um único prompt é inviável. O documento divide o sistema em **módulos independentes**, cada um entregável em 1 prompt do Lovable, respeitando dependências (auth → profiles → empreendimentos → unidades → clientes → negociações → ...).

## Estrutura do documento

O arquivo terá ~12 seções:

### 1. Visão geral do sistema
- O que é (CRM imobiliário B2B para incorporadoras)
- Stack: React 18 + Vite + TS + Tailwind + shadcn/ui + Lovable Cloud (Supabase) + React Query
- Multi-tenant lógico via `empreendimento_id` em quase todas as tabelas
- Convenções: PT-BR, datas `yyyy-MM-dd`, FK para `public.profiles`, RLS sempre, hard-delete em unidades

### 2. Módulos (ordem de execução)

Cada módulo segue o template:
```
### Prompt N — <Nome do módulo>
**Depende de:** <módulos anteriores>
**Entrega:** <páginas, tabelas, hooks, edge functions>
**Prompt para o Lovable:**
> <texto pronto para colar>
**Critério de aceite:** <validação visual/funcional>
```

Sequência planejada:

| # | Módulo | Tabelas principais | Páginas |
|---|--------|--------------------|---------|
| 1 | Fundação (Cloud + design system + sidebar + roles) | `profiles`, `roles`, `user_roles`, `role_permissions`, `modules` | Auth, Index, SemAcesso |
| 2 | Cadastros básicos | `incorporadoras`, `imobiliarias`, `corretores` | Incorporadoras, Imobiliarias, Corretores |
| 3 | Empreendimentos e estrutura física | `empreendimentos`, `blocos`, `tipologias`, `unidades`, `boxes`, `fachadas`, `mapa_empreendimento`, `unidade_historico_precos`, `empreendimento_corretores/imobiliarias/midias/documentos` | Empreendimentos, EmpreendimentoDetalhe, MapaUnidadesPage |
| 4 | Usuários e vínculos | `user_empreendimentos`, `user_module_permissions`, edge `create-user`/`delete-user`/`reset-user-password` | Usuarios |
| 5 | Clientes (PF/PJ) | `clientes`, `cliente_telefones`, `cliente_socios`, `cliente_interacoes` | Clientes |
| 6 | Atividades / Forecast / Diário | `atividades`, `atividade_etapas`, `atividade_responsaveis`, `atividade_comentarios`, `atividade_historico`, `funis`, `funil_etapas`, `tipos_atendimento_config` | Atividades, Forecast, DiarioBordo |
| 7 | Negociações + Propostas + Contratos | `negociacoes`, `negociacao_*`, `propostas`, `proposta_*`, `modalidades_pagamento`, `modalidade_componentes`, `tipos_parcela`, `template_condicoes_pagamento`, `contratos`, `contrato_*` | Negociacoes, NovaPropostaComercial, Propostas, Contratos, AssinarContrato, ConfiguracaoNegociacoes |
| 8 | Comissões e Bonificações | `configuracao_comissoes`, `comissoes`, `comissao_parcelas`, `bonificacoes`, `usuario_empreendimento_bonus`, `metas_comerciais` | Comissoes, Bonificacoes, MetasComerciais |
| 9 | Financeiro / DRE | `plano_contas`, `categorias_fluxo`, `centros_custo`, `centro_custo_empreendimentos`, `lancamentos_financeiros`, `saldos_mensais` | Financeiro, DRE |
| 10 | Marketing + Briefings + Eventos | `projetos_marketing`, `tarefas_projeto`, `projeto_*`, `ticket_etapas`, `ticket_criativos`, `briefings`, `briefing_referencias`, `eventos`, `evento_*` | Marketing, MarketingCalendario, MarketingDetalhe, EquipeMarketing, DashboardMarketing, EtapasTickets, Briefings, Eventos, EventoDetalhe, EventoTemplates, EventosCalendario |
| 11 | Planejamento global | `planejamento_itens`, `planejamento_fases`, `planejamento_status`, `planejamento_*`, `google_calendar_embeds`, edge `fetch-google-calendar` | Planejamento, PlanejamentoConfiguracoes |
| 12 | Portal do Corretor (Imobiliária) | reaproveita; rotas `/portal/*`, edges `register-corretor`/`register-imobiliaria` | PortalDashboard, PortalEmpreendimentos, PortalEmpreendimentoDetalhe, PortalSolicitacoes, PortalClientes, PortalCorretoresGestao, PortalMinhaImobiliaria, PortalEventos |
| 13 | Portal do Incorporador (read-only executivo) | views/queries; contexto de filtro global | PortalIncorporador* (Dashboard, Executivo, Forecast, Marketing, Planejamento, Disponibilidade, Propostas) |
| 14 | Dashboards executivos + Relatórios + Auditoria | `audit_logs`, `notificacoes` | DashboardExecutivo, Relatorios, Auditoria, Solicitacoes |
| 15 | Webhooks / integrações n8n | `webhooks`, `webhook_logs`, `webhook_variaveis_disponiveis`, edges `webhook-dispatcher`, `webhook-assinatura`, `cleanup-webhook-logs` | Configuracoes (aba) |
| 16 | Configurações gerais + Termos | `configuracoes_sistema`, `configuracao_comercial`, `termos_versoes`, `termos_aceites`, `fluxo_aprovacao_config` | Configuracoes, TermosUso, PoliticaPrivacidade |

### 3. Convenções globais (anexo)
Inclui todas as regras do `mem://index.md` que devem ser passadas em **todo** prompt:
- PT-BR
- `parseDateLocal` + `yyyy-MM-dd`
- FKs apontam para `public.profiles(id)`
- Roles em tabela separada + função `has_role` SECURITY DEFINER
- Sem objetos aninhados em update/insert do Supabase
- Hard-delete em unidades
- Nomenclatura "Resumo" vs "Forecast"

### 4. Glossário de termos de negócio
Atividade, Negociação, Proposta, Contrato, Forecast, Diário de Bordo, Empreendimento, Unidade, Bloco, Tipologia, Box, Fachada, Bonificação, Comissão (RT), Gestor, Corretor autônomo vs vinculado.

### 5. Checklist de migração de dados (opcional)
Ordem segura de seed se importar dados de outro sistema.

## Entrega

Único arquivo: `SISTEMA_PROMPTS.md` na raiz do projeto. Sem alterações de código.

## Próximos passos após aprovação

1. Gerar o arquivo conforme estrutura acima.
2. (Opcional, em prompt seguinte) gerar 1 arquivo por módulo em `docs/prompts/NN-modulo.md` para facilitar o uso individual.
