

# Plano Atualizado: Visao Global + Fases por Empreendimento + Google Calendar (iCal embed)

Este plano consolida as 3 mudancas solicitadas.

---

## 1. Visao Global como entrada principal

Remover o toggle global/empreendimento em `Planejamento.tsx`. O calendario global (`PlanejamentoCalendario.tsx`) passa a ser a view principal com CRUD completo (reutilizando `CalendarioCriarTarefaPopover` e `CalendarioDiaDetalhe`). Filtro de empreendimento fica inline no header do calendario. Remover restricao de `isSuperAdmin` para acessar.

**Arquivos:** `Planejamento.tsx`, `PlanejamentoCalendario.tsx`

---

## 2. Fases vinculadas a empreendimentos

**Migracao SQL:**
```sql
ALTER TABLE public.planejamento_fases
ADD COLUMN empreendimento_id uuid REFERENCES public.empreendimentos(id) ON DELETE CASCADE DEFAULT NULL;
```
- `NULL` = fase base (template)
- Com ID = fase customizada daquele empreendimento

**Frontend:** `usePlanejamentoFases` recebe `empreendimentoId` opcional e busca fases base + fases do empreendimento. `PlanejamentoFasesEditor` permite distinguir fases base de fases vinculadas.

**Arquivos:** migracao SQL, `us<lov-plan>

# Plano Atualizado: Visao Global + Fases por Empreendimento + Google Calendar

Consolida as 3 mudancas solicitadas.

---

## 1. Visao Global como entrada principal

Remover toggle global/empreendimento em `Planejamento.tsx`. O calendario global (`PlanejamentoCalendario.tsx`) passa a ser a view principal com CRUD completo (reutilizando `CalendarioCriarTarefaPopover` e `CalendarioDiaDetalhe`). Filtro de empreendimento inline no header. Remover restricao de `isSuperAdmin`.

**Arquivos:** `Planejamento.tsx`, `PlanejamentoCalendario.tsx`, `PlanejamentoGlobal.tsx`

---

## 2. Fases vinculadas a empreendimentos

**Migracao SQL:**
```sql
ALTER TABLE public.planejamento_fases
ADD COLUMN empreendimento_id uuid REFERENCES public.empreendimentos(id) ON DELETE CASCADE DEFAULT NULL;
```
- `NULL` = fase base (template global)
- Com ID = fase customizada daquele empreendimento

**Frontend:** `usePlanejamentoFases` recebe `empreendimentoId` opcional e busca fases base (`NULL`) + fases do empreendimento. `PlanejamentoFasesEditor` permite distinguir e criar fases base vs vinculadas.

**Arquivos:** migracao SQL, `usePlanejamentoFases.ts`, `PlanejamentoFasesEditor.tsx`, `planejamento.types.ts`

---

## 3. Exibicao de Google Calendar via iframe embed

A forma mais simples de exibir eventos do Google Calendar somente como visualizacao e usar o **iframe embed** que o proprio Google fornece. Sem necessidade de OAuth, Edge Function, ou parsing de iCal.

**Como funciona:**
- O Google Calendar oferece uma URL de embed publica: `https://calendar.google.com/calendar/embed?src=EMAIL&ctz=TIMEZONE`
- Basta renderizar um `<iframe>` com essa URL no calendario do sistema
- E somente leitura por natureza -- o usuario ve os eventos mas nao pode editar

**Implementacao:**
- Criar tabela `google_calendar_embeds` no Supabase para armazenar as URLs de embed configuradas (por usuario ou global):
```sql
create table public.google_calendar_embeds (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  nome text not null default 'Google Calendar',
  embed_url text not null,
  is_active boolean default true,
  created_at timestamptz default now()
);
```
- Novo componente `GoogleCalendarEmbed.tsx`: renderiza o iframe com a URL configurada
- Novo dialog `ConfigurarGoogleCalendarDialog.tsx`: permite ao usuario adicionar/remover URLs de embed
- No calendario global, adicionar um botao "Google Calendar" que abre um painel/drawer lateral com o iframe embed, ao lado do calendario do sistema
- Toggle para mostrar/ocultar o painel do Google Calendar

**Limitacoes:**
- Somente visualizacao (read-only)
- O calendario do Google precisa estar compartilhado publicamente para o embed funcionar
- Nao ha integracao de dados -- os eventos do Google aparecem no iframe separado, nao mesclados nas celulas do calendario do sistema

**Arquivos novos:** `GoogleCalendarEmbed.tsx`, `ConfigurarGoogleCalendarDialog.tsx`, `useGoogleCalendarEmbeds.ts`, migracao SQL

**Arquivos modificados:** `PlanejamentoCalendario.tsx` (adicionar botao e painel do Google Calendar)

---

## Resumo de arquivos

| Arquivo | Acao |
|---|---|
| Migracao SQL | Adicionar `empreendimento_id` em `planejamento_fases` + criar tabela `google_calendar_embeds` |
| `src/pages/Planejamento.tsx` | Simplificar -- visao global como padrao |
| `src/components/planejamento/PlanejamentoCalendario.tsx` | CRUD completo + painel Google Calendar |
| `src/hooks/usePlanejamentoFases.ts` | Filtro por empreendimento |
| `src/components/planejamento/PlanejamentoFasesEditor.tsx` | Distinguir fases base vs vinculadas |
| `src/types/planejamento.types.ts` | Adicionar `empreendimento_id` ao tipo `PlanejamentoFase` |
| `src/components/planejamento/GoogleCalendarEmbed.tsx` | Novo -- iframe embed |
| `src/components/planejamento/ConfigurarGoogleCalendarDialog.tsx` | Novo -- gerenciar URLs |
| `src/hooks/useGoogleCalendarEmbeds.ts` | Novo -- CRUD de embeds |

