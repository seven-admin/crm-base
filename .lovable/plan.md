

# Plano: 3 Correções

## 1. Pessoas treinadas — posicionar logo abaixo do item "Treinamento"

**Problema**: A linha "Pessoas treinadas" aparece no final da lista, após todos os tipos. Deveria aparecer imediatamente abaixo do item "Treinamento".

**Solução** (`CategoriaCard.tsx`): Em vez de renderizar `pessoasTreinadas` após o loop de tipos, renderizar inline dentro do loop — logo após o item cujo `tipo === 'treinamento'`. Usar um `flatMap` ou renderizar condicionalmente após cada item.

## 2. Exclusão de lançamento recorrente — excluir filhos futuros

**Problema**: Ao excluir um lançamento recorrente "pai", apenas ele é excluído. Os filhos futuros permanecem.

**Solução** (`useFinanceiro.ts` → `useDeleteLancamento`):
- Antes de excluir o lançamento, verificar se ele é pai de recorrências (tem filhos com `recorrencia_pai_id = id`)
- Se sim, excluir primeiro todos os filhos com `data_vencimento >= hoje` (futuros), depois excluir o pai
- Também verificar se o próprio lançamento tem `recorrencia_pai_id` (é filho) — nesse caso, excluir ele e todos os irmãos futuros com mesmo `recorrencia_pai_id` e `data_vencimento >= data_vencimento` do lançamento selecionado

## 3. Reverter auto-submit ao selecionar cliente

**Problema**: O código adicionado na última iteração faz `form.handleSubmit()` automaticamente ao selecionar cliente no modo `negociacao`, o que o usuário não quer.

**Solução** (`AtividadeForm.tsx` linhas 747-762): Remover o bloco de auto-submit. Manter apenas `field.onChange(value)` no `onValueChange` do Select de cliente.

