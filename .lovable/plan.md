

# Fix: Calendário não atualiza após criar tarefa

## Problema
O calendário usa o hook `usePlanejamentoGlobal` com queryKey `['planejamento-global', ...]`. Quando uma tarefa é criada via `usePlanejamentoItens`, o `onSuccess` invalida apenas `['planejamento-itens']` -- nunca invalida `['planejamento-global']`. Por isso o calendário não reflete a nova tarefa sem reload.

## Solucao
Em `src/hooks/usePlanejamentoItens.ts`, adicionar `queryClient.invalidateQueries({ queryKey: ['planejamento-global'] })` ao lado de cada invalidação de `['planejamento-itens']` nos callbacks `onSuccess` de todas as mutations (create, update, delete, duplicate, bulk create, bulk delete, reorder).

### Arquivo afetado
- `src/hooks/usePlanejamentoItens.ts` -- adicionar invalidação de `['planejamento-global']` em todos os `onSuccess`

