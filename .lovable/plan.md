
# Filtro de mes no Kanban de Negociacoes

## O que muda

Adicionar um seletor de mes (formato "Mes/Ano") na toolbar de filtros da pagina de Negociacoes. O filtro vai usar o campo `created_at` da tabela `negociacoes` para exibir apenas as fichas criadas no mes selecionado. O valor padrao sera o mes atual.

## Alteracao 1 — Adicionar campo `mes` ao tipo de filtros

**Arquivo:** `src/types/negociacoes.types.ts`

- Adicionar `mes?: string` (formato `YYYY-MM`) ao `NegociacaoFilters`

**Arquivo:** `src/pages/negociacoes/NegociacoesToolbar.tsx`

- Adicionar `mes` ao `NegociacoesFilters` local tambem

## Alteracao 2 — Seletor de mes na toolbar

**Arquivo:** `src/pages/negociacoes/NegociacoesToolbar.tsx`

- Adicionar um `Select` com os ultimos 12 meses + opcao "Todos os meses"
- Gerar as opcoes dinamicamente com `date-fns` (`format`, `subMonths`)
- Labels no formato "Mar/2026", "Fev/2026", etc.
- Valores no formato `YYYY-MM`
- Posicionar como primeiro filtro na linha de selects (antes de Empreendimento)

## Alteracao 3 — Aplicar filtro no hook de dados

**Arquivo:** `src/hooks/useNegociacoes.ts`

- Em `useNegociacoesKanban` e `useNegociacoes`: quando `filters.mes` estiver presente, adicionar filtro de range no `created_at`:
  - `.gte('created_at', '2026-03-01')` (primeiro dia do mes)
  - `.lt('created_at', '2026-04-01')` (primeiro dia do mes seguinte)

## Alteracao 4 — Persistir nos search params

**Arquivo:** `src/pages/Negociacoes.tsx`

- Adicionar `'mes'` ao array `FILTER_KEYS`
- Incluir `mes` no objeto `kanbanFilters` passado ao hook
- O mes atual sera o valor padrao (definido no `filtersFromParams` quando nao ha param na URL)

## Resumo de arquivos

| Arquivo | Mudanca |
|---------|---------|
| `src/types/negociacoes.types.ts` | Adicionar `mes?: string` ao `NegociacaoFilters` |
| `src/pages/negociacoes/NegociacoesToolbar.tsx` | Novo Select de mes com ultimos 12 meses |
| `src/hooks/useNegociacoes.ts` | Filtrar por `created_at` usando range do mes |
| `src/pages/Negociacoes.tsx` | Adicionar `mes` ao FILTER_KEYS e kanbanFilters |
