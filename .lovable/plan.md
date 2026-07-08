
# Remoção dos módulos Eventos, Marketing e Planejamento

Remoção end-to-end das três funcionalidades: código frontend, rotas, permissões, hooks, tipos, e tabelas/enums/sequences no banco.

## Escopo por camada

### 1. Rotas e navegação (`src/App.tsx`, `AppTopbar.tsx`, `Sidebar.tsx`)
Remover imports lazy, rotas e itens de menu:
- **CRM interno:** `/marketing/*`, `/marketing/briefings`, `/marketing/dashboard`, `/marketing/equipe`, `/marketing/etapas`, `/marketing/calendario`, `/marketing/:id`, `/planejamento`, `/planejamento/configuracoes`, `/eventos`, `/eventos/calendario`, `/eventos/:id`, `/eventos/templates`.
- **Portal Corretor:** rota `eventos` (`PortalEventos`).
- **Portal Incorporador:** rotas `marketing` e `planejamento` (`PortalIncorporadorMarketing`, `PortalIncorporadorPlanejamento`) e respectivas abas/menu.
- Remover grupos "Planejamento", "Marketing" e "Eventos" da topbar (e sidebar legada).

### 2. Páginas removidas
`src/pages/Marketing.tsx`, `MarketingCalendario.tsx`, `MarketingDetalhe.tsx`, `EtapasTickets.tsx`, `DashboardMarketing.tsx`, `EquipeMarketing.tsx`, `Briefings.tsx`, `Eventos.tsx`, `EventoDetalhe.tsx`, `EventosCalendario.tsx`, `EventoTemplates.tsx`, `Planejamento.tsx`, `PlanejamentoConfiguracoes.tsx`, `portal/PortalEventos.tsx`, `portal-incorporador/PortalIncorporadorMarketing.tsx`, `portal-incorporador/PortalIncorporadorPlanejamento.tsx`.

### 3. Componentes, hooks, tipos
Remover diretórios/arquivos inteiros:
- `src/components/eventos/`, `src/components/marketing/`, `src/components/planejamento/`, `src/components/briefings/`.
- Hooks: `useEventos`, `useEventoInscricoes`, `useEventoTemplates`, `useTickets`, `useTicketEtapas`, `useTicketCriativos`, `useProjetosMarketing`, `useProjetoResponsaveis`, `useEquipeMarketing`, `useDashboardMarketing`, `useRelatoriosMarketing`, `useBriefings`, `useBriefingReferencias`, `usePlanejamentoFases`, `usePlanejamentoStatus`, `usePlanejamentoItens`, `usePlanejamentoItemResponsaveis`, `usePlanejamentoGlobal`, `usePlanejamentoHistorico`, `useGoogleCalendarEvents`, `useGoogleCalendarEmbeds`, `useResumoAtividadesPorCategoria` (auditar uso).
- Tipos: `src/types/marketing.types.ts`, `src/types/planejamento.types.ts`, `src/types/briefings.types.ts`.
- Edge function: `supabase/functions/fetch-google-calendar/` (usada só pelo planejamento).

### 4. Referências cruzadas a limpar
- Sidebar de configurações / rotas admin (`PlanejamentoConfiguracoes`, `EtapasTickets`, `EventoTemplates`).
- Auditar `useSidebarColors`, `useConfiguracoesSistema` (chave `planejamento_limite_sobrecarga`), `useDefaultRoute`, `PermissionGate`, e qualquer import residual — remover apenas o que for exclusivo dos módulos deletados.

### 5. Banco de dados (migration destrutiva)
Drop em cascade:
- **Tabelas:** `eventos`, `evento_tarefas`, `evento_inscricoes`, `evento_membros`, `evento_templates`, `evento_template_tarefas`, `tickets` (não existe, mas `ticket_criativos`, `ticket_etapas`), `projetos_marketing`, `projeto_comentarios`, `projeto_historico`, `projeto_responsaveis`, `tarefas_projeto`, `briefings`, `briefing_referencias`, `planejamento_itens`, `planejamento_fases`, `planejamento_status`, `planejamento_historico`, `planejamento_item_responsaveis`, `google_calendar_embeds`.
- **Sequences:** `evento_codigo_seq`, `projeto_codigo_seq`, `briefing_codigo_seq`.
- **Funções:** `generate_evento_codigo`, `generate_projeto_codigo`, `generate_briefing_codigo`, `log_planejamento_changes`, `is_marketing_supervisor`. Ajustar `reset_sequence_value` e `get_all_sequence_values` removendo as sequences deletadas.
- **Módulos de permissão** (`public.modules`): remover linhas cujo `name` esteja em (`projetos_marketing`, `projetos_marketing_config`, `briefings`, `eventos`, `eventos_templates`, `planejamento`, `planejamento_config`); cascade remove entradas em `role_permissions` e `user_module_permissions`.
- **Storage buckets:** `projetos-arquivos` e `briefing-referencias` — remover buckets e objetos (a confirmar via SQL em `storage.objects`/`storage.buckets`).
- **Configurações de sistema:** remover chave `planejamento_limite_sobrecarga` de `configuracoes_sistema`.

Migration única, em transação, com `DROP ... CASCADE`.

## Ordem de execução
1. Migration destrutiva (aprovação do usuário).
2. Remover arquivos frontend (páginas, hooks, tipos, componentes, edge function).
3. Limpar rotas em `App.tsx` e menus em `AppTopbar.tsx` / `Sidebar.tsx`.
4. Rodar `tsgo` até zerar erros (esperado ajustes em imports órfãos).
5. Verificação: `rg -i "planejamento|marketing|evento|briefing|ticket_etapa" src/` para garantir zero referências residuais fora de `atividades`.

## Fora de escopo
- Renomear/reposicionar demais itens de menu.
- Alterações em Atividades, Financeiro, Negociações ou outros módulos.
- Backup manual — o usuário confirmou drop irreversível.

## Riscos
- **Irreversível:** dados de eventos/marketing/planejamento serão perdidos.
- Possíveis referências em `useSidebarColors` (cores `--nav-marketing`, `--nav-eventos`, `--nav-planejamento`) — serão removidas dos tokens.
- Se algum webhook/edge function fora do escopo consumir essas tabelas, precisará ajuste (validarei durante execução).
