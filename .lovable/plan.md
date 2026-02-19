

# Alterar Tipologia em Lote

## Resumo
Adicionar a funcionalidade de alterar a tipologia de multiplas unidades de uma vez, seguindo o mesmo padrao ja existente para "Alterar Status em Lote".

## Alteracoes

### 1. Novo hook: `useUpdateUnidadesTipologiaBatch` (em `src/hooks/useUnidades.ts`)
- Criar uma mutation que faz `supabase.from('unidades').update({ tipologia_id }).in('id', ids)`
- Tambem atualiza `area_privativa` automaticamente com base na tipologia selecionada (se a tipologia tiver area definida)
- Invalida as queries de unidades apos sucesso

### 2. Novo componente: `AlterarTipologiaLoteDialog` (em `src/components/empreendimentos/AlterarTipologiaLoteDialog.tsx`)
- Dialog com select de tipologias do empreendimento (usando `useTipologias`)
- Checkbox opcional "Atualizar area privativa" para aplicar a area da tipologia nas unidades
- Preview mostrando quantas unidades serao alteradas
- Mesmo layout do `AlterarStatusLoteDialog` existente

### 3. Integrar no `UnidadesTab.tsx`
- Adicionar novo modo de selecao `'tipologia'` ao tipo `selectionMode`
- Adicionar botao "Alterar Tipologia" na barra de acoes (ao lado de "Alterar Status")
- Quando em modo tipologia, exibir botao de confirmacao que abre o dialog
- Renderizar o novo `AlterarTipologiaLoteDialog`

## Detalhes tecnicos

### Hook (useUnidades.ts)
```typescript
export function useUpdateUnidadesTipologiaBatch() {
  // mutationFn recebe { ids, empreendimentoId, tipologia_id, area_privativa? }
  // Faz update de tipologia_id e opcionalmente area_privativa
}
```

### Fluxo do usuario
1. Clica em "Alterar Tipologia" na barra de acoes
2. Entra em modo de selecao (seleciona unidades clicando nelas)
3. Clica em "Alterar Tipologia (N)" para abrir o dialog
4. Seleciona a tipologia desejada no select
5. Opcionalmente marca "Atualizar area privativa"
6. Confirma a alteracao

