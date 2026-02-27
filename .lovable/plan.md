

# Corrigir exibicao de comentarios do incorporador

## Problema

A tabela `negociacao_comentarios` nao possui foreign key de `user_id` para `profiles`. O hook `useNegociacaoComentarios` tenta fazer um join `profiles!user_id(full_name)` que retorna erro 400 do PostgREST:

```
"Could not find a relationship between 'negociacao_comentarios' and 'profiles' in the schema cache"
```

O INSERT funciona (status 201), mas o SELECT sempre falha, entao os comentarios nunca aparecem na tela.

## Solucao

### 1. Migration SQL - Adicionar foreign key

Criar foreign key de `negociacao_comentarios.user_id` para `profiles.id`, permitindo o join via PostgREST.

Tambem verificar/adicionar RLS policy de SELECT para que o incorporador consiga ler os comentarios da negociacao.

### 2. Nenhuma mudanca no frontend

O codigo do hook e do componente `ComentariosSection` ja esta correto. Basta corrigir a relacao no banco.

---

## Detalhes tecnicos

| Arquivo | Mudanca |
|---------|---------|
| Migration SQL | `ALTER TABLE negociacao_comentarios ADD CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES profiles(id)` + RLS policy SELECT para incorporador |

