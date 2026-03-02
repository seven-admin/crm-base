

# Corrigir Filtro de Meses em Atividades e Adicionar Modal de Atividades no Forecast

## Problema 1: Filtro de meses nao funciona na aba Lista

A logica de filtro em `applyAtividadesFilters` (src/hooks/useAtividades.ts, linhas 55-56) esta invertida:

```text
// ATUAL (errado):
if (filters?.data_inicio) q = q.lte('data_inicio', filters.data_inicio);
if (filters?.data_fim)    q = q.gte('data_fim', filters.data_fim);
```

Quando o usuario seleciona "Fevereiro 2026", o filtro define:
- `data_inicio = '2026-02-01'`
- `data_fim = '2026-02-28'`

A query resultante busca atividades cuja `data_inicio <= 2026-02-01` E `data_fim >= 2026-02-28`. Ou seja, so retorna atividades que **cobrem o mes inteiro** -- quase nenhuma.

A logica correta de sobreposicao de intervalo e: uma atividade que vai de A ate B se sobrepoe ao filtro [inicio, fim] quando `A <= fim AND B >= inicio`.

### Correcao

Trocar os campos:

```text
if (filters?.data_inicio) q = q.gte('data_fim', filters.data_inicio);
if (filters?.data_fim)    q = q.lte('data_inicio', filters.data_fim);
```

Isso garante: "atividade termina apos o inicio do filtro" E "atividade comeca antes do fim do filtro" = sobreposicao correta.

**Arquivo:** `src/hooks/useAtividades.ts` (linhas 55-56)

---

## Problema 2: Clicar nos badges do Forecast para ver atividades

Os cards de categoria no Forecast (`CategoriaCard`) ja suportam `onBadgeClick`, mas a pagina `/forecast` (Forecast.tsx) nao conecta esse callback. Apenas o Diario de Bordo usa.

### Solucao

1. Adicionar estado para controlar o dialog no `Forecast.tsx`
2. Passar `onBadgeClick` ao `CategoriaCard` para abrir o `ForecastBatchStatusDialog` existente (que ja lista atividades por categoria/status)
3. Fazer o mesmo para a renderizacao de cards tanto na aba "negociacoes" quanto "atividades"

O `ForecastBatchStatusDialog` ja existe e mostra a lista de atividades filtradas por categoria e status (abertas, fechadas, atrasadas, futuras), com opcao de alterar status em lote. Basta conecta-lo.

**Arquivo:** `src/pages/Forecast.tsx`

Mudancas:
- Importar `ForecastBatchStatusDialog` e `useState`
- Adicionar estado `batchDialog` com `{ open, categoria, statusGroup }`
- Passar `onBadgeClick` ao `renderCategoriaCards` que dispara a abertura do dialog
- Renderizar o `ForecastBatchStatusDialog` no final do componente

---

## Resumo de arquivos

1. `src/hooks/useAtividades.ts` -- inverter logica de filtro de datas (2 linhas)
2. `src/pages/Forecast.tsx` -- conectar `onBadgeClick` nos cards e renderizar o dialog de listagem

