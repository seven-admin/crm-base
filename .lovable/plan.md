
# Remover vendas historicas dos contadores do Forecast

## Alteracao

Arquivo: `src/hooks/useForecastFinanceiro.ts`

O hook atualmente busca vendas de duas fontes:
1. Tabela `comissoes` (vendas registradas no sistema)
2. Tabela `unidades` com `status = 'vendida'` (inclui vendas historicas)

E usa `Math.max` entre os dois valores.

A alteracao e simples: remover a query de unidades vendidas (linhas 60-65), remover do `Promise.all`, e usar apenas o valor de vendas via comissoes (`valorVendasComissoes`) diretamente como `valorVendas`.

### O que muda
- Remove a query `unidadesVendidasQuery` (busca na tabela `unidades`)
- Remove o calculo `valorVendasUnidades` e o `Math.max`
- `valorVendas` passa a ser apenas a soma de `valor_venda` da tabela `comissoes`
- Os demais contadores (comissoes por gestor, negociacoes, propostas) permanecem iguais

Isso garante que apenas vendas efetivamente registradas pelo fluxo do sistema (com comissao gerada) aparecam nos KPIs financeiros.
