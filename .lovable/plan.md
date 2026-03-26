

# Correção: Contadores do Portal Incorporador — Usar Apenas Negociações Ganhas

## Problema

O KPI "Vendas do Mês" no dashboard (`/portal-incorporador`) e a contagem de "vendidas" usam `Math.max` entre 3 fontes (contratos assinados, unidades com `data_venda`, negociações ganhas). Isso infla o valor quando unidades históricas têm `data_venda` incorreta.

O usuário quer que **apenas negociações ganhas** (etapa `is_final_sucesso`) sejam consideradas nos contadores de vendas.

## Solução

### 1. `src/hooks/useDashboardExecutivo.ts` — Linhas 224-227

Substituir o `Math.max` por usar diretamente os valores das negociações ganhas:

```typescript
// ANTES
const vendasMesAtual = Math.max(vendasMesAtualContratos, valorUnidadesVendidasMesAtual, valorNegociacoesGanhasMesAtual);
const vendasMesAnterior = Math.max(vendasMesAnteriorContratos, valorUnidadesVendidasMesAnterior, valorNegociacoesGanhasMesAnterior);
const unidadesVendidasMesCount = Math.max(contratosMesAtual.length, unidadesVendidasMesAtual.length, negociacoesGanhasMesAtual.length);

// DEPOIS
const vendasMesAtual = valorNegociacoesGanhasMesAtual;
const vendasMesAnterior = valorNegociacoesGanhasMesAnterior;
const unidadesVendidasMesCount = negociacoesGanhasMesAtual.length;
```

Mesma lógica para a tendência de vendas (linha 253):
```typescript
// ANTES
tendenciaVendas.push({ mes: format(mesRef, 'MMM'), valor: Math.max(...) });
// DEPOIS
tendenciaVendas.push({ mes: format(mesRef, 'MMM'), valor: vendasMesNegs });
```

### 2. `src/pages/portal-incorporador/PortalIncorporadorForecast.tsx` — Linhas 137-142

Tratar `status_aprovacao = NULL` como "Pendente" nos KPIs de negociação:

```typescript
const negKPIs = {
  total: negociacoes?.length || 0,
  pendentes: negociacoes?.filter((n: any) => 
    n.status_aprovacao === 'pendente' || n.status_aprovacao === null
  ).length || 0,
  aprovadas: negociacoes?.filter((n: any) => n.status_aprovacao === 'aprovada').length || 0,
  rejeitadas: negociacoes?.filter((n: any) => n.status_aprovacao === 'rejeitada').length || 0,
};
```

### Arquivos alterados
1. `src/hooks/useDashboardExecutivo.ts` — Usar apenas negociações ganhas como fonte de vendas
2. `src/pages/portal-incorporador/PortalIncorporadorForecast.tsx` — Incluir `NULL` nos pendentes

