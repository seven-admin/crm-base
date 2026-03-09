
# Plano Completo — Implementado ✅

## 1. Migração SQL ✅
- `send_campanha` default `'1'` em `corretores`
- Coluna `cod_sorteio` (text, unique) com função `generate_cod_sorteio()` formato `0000-X0X0-XXXX`
- Trigger `BEFORE INSERT` para geração automática
- Backfill para corretores existentes
- Coluna `qtd_corretores` (integer) em `atividades`

## 2. Kanban de Negociações — `created_at` e campos faltantes ✅
- `useNegociacoesKanban` expandido com `created_at`, `corretor`, `imobiliaria`, `valor_entrada`, `observacoes`, etc.

## 3. Campo `qtd_corretores` para ligações ✅
- Formulário: campo visível quando `tipo=ligacao` + `categoria=imobiliaria`
- Detalhe: exibição no dialog
- Tipos: `Atividade` e `AtividadeFormData` atualizados

## 4. Visão Global como entrada principal ✅
- Removido toggle global/empreendimento em `Planejamento.tsx`
- Calendário global com CRUD completo é a view padrão
- Filtro de empreendimento inline no header do calendário
- Removida restrição de `isSuperAdmin` para acessar

## 5. Fases vinculadas a empreendimentos ✅
- Coluna `empreendimento_id` (nullable, FK) em `planejamento_fases`
- `NULL` = fase base (template global), com ID = fase customizada
- `usePlanejamentoFases` aceita `empreendimentoId` opcional
- Busca fases base + fases do empreendimento selecionado

## 6. Google Calendar embed (somente leitura) ✅
- Tabela `google_calendar_embeds` com RLS
- Componente `GoogleCalendarEmbed.tsx` com iframe
- Dialog `ConfigurarGoogleCalendarDialog.tsx` para gerenciar URLs
- Hook `useGoogleCalendarEmbeds.ts` para CRUD
- Drawer no calendário global para exibir Google Calendar
