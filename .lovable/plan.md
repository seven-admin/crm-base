Renomear a aba "Negociações" para "Atendimentos" na tela `/forecast`.

## Alteração

Em `src/pages/Forecast.tsx`, alterar o texto do `TabsTrigger` da aba `negociacoes` de "Negociações" para "Atendimentos". O `value` interno permanece `"negociacoes"` para não impactar lógica/estado existente — só o label visível muda.

Nenhuma outra tela é afetada.