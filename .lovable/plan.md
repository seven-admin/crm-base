

# Fix: Fases do empreendimento no modal de criacao de tarefa

## Problema
No `PlanejamentoCalendario.tsx`, o hook `usePlanejamentoFases` e chamado com `localEmpreendimentoId` (linha 58). Quando o usuario esta na visao global (sem empreendimento filtrado), `localEmpreendimentoId` e `undefined`, entao so fases globais sao carregadas.

Quando o usuario abre o popover de criacao e seleciona um empreendimento via `createEmpreendimentoId`, as fases **nao sao recarregadas** porque o hook continua usando `localEmpreendimentoId` (que permanece `undefined`). As fases especificas daquele empreendimento nunca aparecem.

## Solucao

No `PlanejamentoCalendario.tsx`:

1. Calcular um `effectiveEmpreendimentoId` = `localEmpreendimentoId || createEmpreendimentoId` 
2. Usar esse ID no `usePlanejamentoFases(effectiveEmpreendimentoId)` para que, ao selecionar um empreendimento no popover de criacao, as fases desse empreendimento sejam carregadas automaticamente

Alternativamente, adicionar um segundo `usePlanejamentoFases(createEmpreendimentoId)` e usar essas fases no popover quando em visao global.

### Arquivo afetado
- `src/components/planejamento/PlanejamentoCalendario.tsx` — ajustar o ID passado ao hook de fases

