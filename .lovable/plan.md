Consolidar `/forecast` em página única e remover KPIs financeiros.

## Mudanças em `src/pages/Forecast.tsx`

1. **Remover Tabs** (`Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`) — exibir tudo em uma única visão vertical.
2. **Remover a linha de KPIs financeiros** (`renderFinanceiroKPIs` e seu uso): "Valor em Vendas", "Total Comissões", "Negociações Ativas", "Propostas Aceitas". Remover também o hook `useForecastFinanceiro` e ícones não utilizados (`DollarSign`, `TrendingUp`, `FileCheck`, `Handshake`).
3. **Nova estrutura da página** (após o header de filtros):
   - Seção "Atendimentos" — título + grid de `CategoriaCard` usando `resumoNegociacoes` + `TIPOS_NEGOCIACAO`.
   - Seção "Atividades" — título + grid de `CategoriaCard` usando `resumoAtividades` + `TIPOS_DIARIO` (com `pessoasTreinadas`).
4. Manter o `ForecastBatchStatusDialog` e o restante da lógica (filtros de gestor, competência, navegação de mês) inalterados.

Nada além desta página é alterado.