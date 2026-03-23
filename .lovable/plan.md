

# Corrigir RLS violation ao criar negociação

## Problema
A policy "Gestores can insert own negociacoes" exige `gestor_id = auth.uid()`, mas o INSERT em `useCreateNegociacao` (linha 1086) não inclui `gestor_id`. Quando um gestor_produto tenta criar uma negociação, o RLS bloqueia.

Existe um trigger `auto_set_gestor_id_clientes` para a tabela `clientes`, mas **não existe equivalente para `negociacoes`** — o `gestor_id` precisa ser enviado explicitamente.

## Solução

### `src/hooks/useNegociacoes.ts`
No `useCreateNegociacao`, adicionar `gestor_id` ao objeto de insert, preenchendo com `auth.uid()` do usuário logado:

```typescript
const { data: { user } } = await supabase.auth.getUser();

.insert({
  ...campos_existentes,
  gestor_id: negociacaoData.gestor_id || user?.id,
  created_by: user?.id,
})
```

Isso garante que gestor_produto passe no RLS (`gestor_id = auth.uid()`), e para admins/corretores a policy deles já permite sem essa condição.

### Arquivo a modificar
- `src/hooks/useNegociacoes.ts` — adicionar `gestor_id` e `created_by` ao insert de `useCreateNegociacao`

