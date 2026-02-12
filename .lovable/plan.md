

# Corrigir bug: meta comercial salva mas nao aparece na listagem

## Problema identificado

A meta esta sendo salva no banco de dados com sucesso (confirmei que existe um registro). O problema e que apos salvar, a query da aba "Gerenciar Metas" nao e atualizada.

No hook `useCreateMeta` (arquivo `src/hooks/useMetasComerciais.ts`), o `onSuccess` invalida apenas:
- `metas-comerciais`
- `historico-metas`

Porem **nao invalida** `todas-metas`, que e a query usada pela tabela na aba "Gerenciar Metas".

## Solucao

### Arquivo: `src/hooks/useMetasComerciais.ts`

Adicionar `queryClient.invalidateQueries({ queryKey: ['todas-metas'] })` no `onSuccess` do `useCreateMeta`.

### Arquivo: `src/pages/MetasComerciais.tsx`

Apos salvar a meta com sucesso, mudar automaticamente para a aba "Gerenciar Metas" para que o usuario veja o resultado.

---

### Detalhes tecnicos

1. **`src/hooks/useMetasComerciais.ts`** - No `useCreateMeta`, adicionar invalidacao de `todas-metas` no `onSuccess` (igual ja existe no `useUpdateMeta` e `useDeleteMeta`)

2. **`src/pages/MetasComerciais.tsx`** - Transformar a aba ativa em estado controlado e, no `handleSaveMeta`, apos sucesso, setar a aba para `"gerenciar"`

