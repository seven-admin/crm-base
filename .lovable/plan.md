
# Fix: Carregar variáveis selecionadas ao editar webhook

## Problema Identificado

Ao abrir o modal de edição, o `webhookForm.reset()` define o `evento` e as `variaveis_selecionadas` corretamente. Porém, o `Select onValueChange` do campo "Evento" (linha 613-616) dispara quando o valor é definido pelo `reset()`, executando `webhookForm.setValue('variaveis_selecionadas', [])` — zerando as variáveis que acabaram de ser carregadas do banco.

## Solução

Alterar o `onValueChange` do Select de evento para só resetar as variáveis quando o evento realmente mudar (ou seja, quando o novo valor for diferente do valor atual do formulário). Isso evita que o reset do form limpe as seleções.

**Arquivo:** `src/pages/Configuracoes.tsx` (linhas 613-616)

Trocar:
```tsx
onValueChange={(val) => {
  field.onChange(val);
  webhookForm.setValue('variaveis_selecionadas', []);
}}
```

Por:
```tsx
onValueChange={(val) => {
  if (val !== field.value) {
    webhookForm.setValue('variaveis_selecionadas', []);
  }
  field.onChange(val);
}}
```

Isso garante que ao abrir para edição (quando o evento já está preenchido com o mesmo valor), as variáveis salvas no banco não sejam apagadas.
