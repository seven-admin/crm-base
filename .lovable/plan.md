

# Reordenar itens nos grupos Comercial e Diario de Bordo

## O que sera feito

Reordenar os itens dentro dos dois grupos no menu lateral para que sigam o padrao: **Dashboard primeiro, Atividades em segundo**.

### Comercial (ordem atual -> nova ordem)

**Atual:**
1. Fichas de Proposta
2. Solicitacoes
3. Forecast
4. Metas Comerciais
5. Atividades

**Nova ordem:**
1. Forecast (funciona como Dashboard do comercial)
2. Atividades
3. Fichas de Proposta
4. Solicitacoes
5. Metas Comerciais

### Diario de Bordo

Ja esta na ordem correta (Dashboard, Atividades). Nenhuma alteracao necessaria.

## Arquivo afetado

| Arquivo | Alteracao |
|---|---|
| `src/components/layout/Sidebar.tsx` | Reordenar os items do grupo Comercial (linhas 96-101) |

Alteracao simples de reordenacao, sem mudanca de logica.

