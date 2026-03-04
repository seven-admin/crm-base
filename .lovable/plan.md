

# Fix: Atividades e Negociações no Portal Incorporador Forecast

## Problemas Identificados

1. **Erro 400 na query de negociações**: O hook `useNegociacoesIncorporador` seleciona `valor_total` na tabela `negociacoes`, mas essa coluna não existe. As colunas de valor disponíveis são: `valor_negociacao`, `valor_proposta`, `valor_tabela`, `valor_total_fechamento`, `valor_entrada`. O erro 400 impede qualquer dado de negociação de carregar no Dashboard.

2. **Referência a `neg.valor_total` no template** (linha 348): O render do valor monetário usa `neg.valor_total` que nunca existirá.

## Solução

**Arquivo:** `src/pages/portal-incorporador/PortalIncorporadorForecast.tsx`

1. **Linha 50**: Trocar `valor_total` por `valor_negociacao` no select da query de negociações.
2. **Linha 348**: Trocar `neg.valor_total` por `neg.valor_negociacao` no template de exibição.

Apenas essas duas alterações resolvem o erro 400 e fazem as negociações e seus KPIs carregarem corretamente no Dashboard.

