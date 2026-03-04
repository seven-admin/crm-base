

# Corrigir filtro de Ressarcimentos

## Problema
O relatório de Ressarcimentos exibe **todos** os lançamentos que possuem `beneficiario_id`, independente da categoria. O registro "PG CONTRATO - THIAGO GONÇALVES" tem `categoria_fluxo = 'PAGAMENTO PJ - SEVEN'` e aparece incorretamente.

## Solução
No `RelatorioRessarcimentos.tsx`, adicionar filtro por `categoria_fluxo` na linha 46:

```typescript
const comBeneficiario = lancamentos.filter(
  (l: any) => l.beneficiario_id != null 
    && l.categoria_fluxo?.toUpperCase() === 'RESSARCIMENTO'
);
```

Isso garante que apenas lançamentos com `categoria_fluxo = 'RESSARCIMENTO'` apareçam no relatório.

## Arquivo afetado
- `src/components/financeiro/RelatorioRessarcimentos.tsx` — ajustar filtro no `useMemo`

