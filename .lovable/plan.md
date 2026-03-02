
Objetivo: corrigir o fluxo de exibição no Kanban de `/negociacoes` para refletir corretamente negociações originadas de atividades comerciais, especialmente quando há filtro de mês e gestor.

Diagnóstico confirmado (com evidências)
1) O Kanban está filtrando por `negociacoes.created_at` (arquivo `src/hooks/useNegociacoes.ts`), não pela data do atendimento/origem.
- Rede capturada: request do Kanban saiu com `created_at=gte.2026-02-01&created_at=lt.2026-03-01`.
- Banco: há 64 negociações ativas; apenas 1 com `created_at` em fev, mas 16 com `data_primeiro_atendimento` em fev.
- Resultado prático: backfill criado em março não aparece quando o usuário escolhe fevereiro.

2) Negociações geradas automaticamente/backfill ficaram com `gestor_id` nulo.
- Query no banco: 63 registros do backfill (dia 2026-03-02) com `gestor_id` nulo.
- Em `useCreateAtividade`/`useUpdateAtividade` o insert automático de negociação não popula `gestor_id`.
- Isso quebra consistência com filtro de gestor e com a semântica de “negociação do gestor da atividade”.

3) Inconsistência de filtros entre Kanban e Lista:
- Toolbar envia `gestor_id`.
- Kanban (`useNegociacoesKanban`) não aplica `gestor_id`.
- Lista paginada aplica `gestor_id`.
- Filtro `mes` foi implementado no Kanban, mas não está implementado em `useNegociacoesPaginated` (apesar de ser enviado em `Negociacoes.tsx`), causando divergência de comportamento entre abas.

4) Fluxo de atividades -> negociações está funcional para atividades elegíveis:
- Em fevereiro houve 43 atividades comerciais, mas só 16 tinham `cliente_id` (pré-requisito para gerar negociação).
- As 16 elegíveis têm negociação ativa vinculada (via `atividade_origem_id`).
- Ou seja: o “sumiço” não é mais criação, é principalmente critério de filtro/data + metadado de gestor ausente.

Plano de correção (implementação)
Etapa 1 — Ajustar regra de filtro de mês para refletir fluxo de atividades
Arquivos:
- `src/hooks/useNegociacoes.ts`
  - `useNegociacoes`
  - `useNegociacoesKanban`
  - `useNegociacoesPaginated` (count + data)

Mudança:
- Trocar filtro de mês de `created_at` para:
  - Preferência: `data_primeiro_atendimento` (quando existir)
  - Fallback: `created_at` (para registros antigos/manuais sem `data_primeiro_atendimento`)
Abordagem técnica:
- No Supabase query builder, aplicar range em coluna única é mais simples; para fallback com OR entre colunas, usar `.or(...)` com dois ranges equivalentes.
- Garantir que a mesma regra seja usada nas 3 consultas (kanban, lista simples e lista paginada) para evitar discrepância entre abas.

Etapa 2 — Incluir `gestor_id` em todo o fluxo de auto-criação
Arquivos:
- `src/hooks/useAtividades.ts` (blocos de auto-criação em create e update)
Mudança:
- No insert de `negociacoes`, preencher `gestor_id` com o gestor da atividade (`data.gestor_id` / `result.gestor_id`).
Benefício:
- Filtro por gestor passa a representar corretamente negociações oriundas de atividades comerciais futuras.

Etapa 3 — Corrigir registros históricos sem gestor
Arquivo:
- Nova migration SQL em `supabase/migrations/*`
Mudança:
- `UPDATE negociacoes n SET gestor_id = a.gestor_id` para registros com `n.gestor_id IS NULL` e `n.atividade_origem_id = a.id`.
- Opcionalmente restringir para `is_active = true` e para tipos comerciais da atividade.
Benefício:
- Dados já migrados passam a respeitar filtro de gestor imediatamente.

Etapa 4 — Padronizar contrato de filtros entre tipos e hooks
Arquivos:
- `src/types/negociacoes.types.ts`
- `src/hooks/useNegociacoes.ts`
- `src/pages/Negociacoes.tsx`
Mudança:
- Adicionar `gestor_id?: string` (e se necessário `search?: string`) em `NegociacaoFilters`.
- Aplicar `filters.gestor_id` no `useNegociacoes` e `useNegociacoesKanban`.
- Incluir `mes?: string` em `NegociacoesPaginatedFilters` e aplicar no count/data query.
Benefício:
- Kanban e Lista respondem aos mesmos filtros vindos da toolbar/URL.

Validação (E2E)
1) Abrir `/negociacoes?gestor_id=4b9cc9ba-12c8-4e4c-a856-e449c98d1771&mes=2026-02`.
2) Confirmar Kanban:
- Antes: mostrava 1.
- Após correção: deve mostrar 3 (referência atual das negociações da atividade desse gestor em fev).
3) Alternar para Lista:
- Total e cards devem bater com Kanban para os mesmos filtros.
4) Trocar mês para `2026-03` e `Todos os meses`:
- Verificar consistência do total entre métricas, Kanban e Lista.
5) Criar nova atividade comercial com cliente + gestor e sem empreendimento explícito:
- Confirmar auto-resolução de empreendimento, criação de negociação, preenchimento de `gestor_id`, e exibição imediata no Kanban com filtro de gestor.

Riscos e cuidados
- Query `.or(...)` em filtros de data precisa ser construída com cuidado no Supabase/PostgREST para manter performance e semântica correta.
- Alteração de filtros em count query paginada deve espelhar exatamente a data query para evitar paginação inconsistente.
- Não alterar migrations antigas já executadas; criar migration incremental de correção de dados (`gestor_id`).

Resultado esperado
- O Kanban de `/negociacoes` passa a exibir negociações originadas de atividades conforme o mês de atendimento/origem (não pela data técnica de inserção em lote).
- Filtro de gestor volta a funcionar de forma confiável para registros novos e históricos.
- Kanban e Lista passam a ter comportamento consistente com os mesmos filtros.
