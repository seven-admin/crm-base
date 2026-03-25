

# Correção: Contador "Vendas do Mês" no Portal do Incorporador

## Diagnóstico

O KPI "Vendas do Mês" usa exclusivamente a tabela `contratos` com `status = 'assinado'`, filtrando registros de "COMPRADOR HISTÓRICO". Para o BELVEDERE em março/2026:

- **0 contratos** criados em março
- **3 unidades** marcadas como `vendida` em março (updated_at em março), totalizando ~R$ 3,4M
- Todos os contratos existentes são "COMPRADOR HISTÓRICO" (filtrados) ou de meses anteriores

**Causa raiz**: As vendas reais estão refletidas na mudança de status das unidades para `vendida`, mas o dashboard só conta contratos assinados. Quando a venda acontece via proposta/negociação (que muda o status da unidade), sem criar um contrato formal, o contador fica zerado.

## Solução

Alterar o hook `useDashboardExecutivo.ts` para incluir uma fonte complementar de vendas: **unidades que mudaram para status `vendida` no mês atual** (baseado em `updated_at`).

### Arquivo: `src/hooks/useDashboardExecutivo.ts`

**Lógica atual (linhas 178-206):**
- Filtra contratos assinados no mês atual
- Soma `valor_contrato` dos que não são "COMPRADOR HISTÓRICO"

**Nova lógica:**
1. Manter a lógica de contratos como está
2. Adicionar cálculo complementar: somar o `valor` de unidades com `status = 'vendida'` e `updated_at` dentro do mês atual
3. Usar o **maior valor** entre as duas fontes (contratos vs unidades vendidas no mês), para evitar dupla contagem
4. Aplicar a mesma lógica para `unidadesVendidas` (count) e `vendasMesAnterior` (para variação %)
5. Aplicar a mesma lógica na tendência de vendas (últimos 6 meses)

**Mudança concreta:**
```typescript
// Vendas via unidades vendidas no mês
const unidadesVendidasMesAtual = (unidades || []).filter(u => {
  if (u.status !== 'vendida') return false;
  const data = new Date(u.updated_at);
  return data >= inicioMesAtual && data <= fimMesAtual;
});
const valorUnidadesVendidasMes = unidadesVendidasMesAtual.reduce(
  (acc, u) => acc + (u.valor || 0), 0
);

// Usar o maior entre contratos e unidades como fonte de vendas do mês
const vendasMesAtualFinal = Math.max(vendasMesAtual, valorUnidadesVendidasMes);
```

Isso requer adicionar `updated_at` ao select de unidades (atualmente: `id, status, valor, empreendimento_id`).

### Impacto
- `PortalIncorporadorDashboard.tsx` - KPI "Vendas do Mês" passará a refletir vendas reais
- `PortalIncorporadorExecutivo.tsx` - Mesmos KPIs corrigidos
- `DashboardExecutivo.tsx` - Dashboard admin também se beneficia

