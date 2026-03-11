

# Corrigir lista de corretores não atualizando após cadastro

## Problema
Após cadastrar um corretor pelo portal da imobiliária, a lista não atualiza automaticamente. O usuário precisa fazer reload manual.

## Causa raiz
No `onSuccess` do `createCorretor`, o `invalidateQueries` não é `await`-ado. Em React Query v5, a invalidação retorna uma Promise e, sem `await`, a refetch pode não completar corretamente antes do React processar o próximo ciclo de renderização.

## Solução

**Arquivo: `src/hooks/useGestorCorretores.ts`**

Tornar o `onSuccess` do `createCorretor` assíncrono e aguardar a invalidação:

```typescript
onSuccess: async (data) => {
  toast.success('Corretor cadastrado com sucesso! Senha de acesso: Seven@1234', { duration: 10000 });
  await queryClient.invalidateQueries({ queryKey: ['gestor-corretores'] });
  // webhook depois da invalidação
  dispararWebhook('corretor_cadastrado', { ... });
},
```

Aplicar o mesmo padrão nos `onSuccess` de `updateCorretor` e `toggleStatus` para consistência.

## Arquivo alterado
- `src/hooks/useGestorCorretores.ts`

