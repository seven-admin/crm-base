

# Correção: NEG-00206 duplicada em duas abas do Portal Incorporador

## Problema
O filtro de `negociacoesEmAndamento` (que alimenta as abas "Atendimentos" e "Negociações") exclui apenas `aprovada_incorporador` e `contra_proposta`, mas **não exclui** `em_analise`. Como a NEG-00206 tem `status_proposta = 'em_analise'`, ela aparece simultaneamente em "Aguardando Aprovação" e "Negociações".

## Solução

### `src/pages/portal-incorporador/PortalIncorporadorPropostas.tsx`
Adicionar `em_analise` à lista de exclusão no filtro `negociacoesEmAndamento` (linha 180):

```typescript
// Antes
!['aprovada_incorporador', 'contra_proposta'].includes(n.status_proposta || '')

// Depois
!['aprovada_incorporador', 'contra_proposta', 'em_analise'].includes(n.status_proposta || '')
```

Isso garante que negociações aguardando aprovação apareçam **apenas** na aba dedicada, sem duplicação nas abas "Atendimentos" ou "Negociações".

### Impacto
- 1 linha alterada
- Sem alteração de banco
- Negociações com `em_analise` ficam exclusivamente na aba "Aguardando Aprovação"

