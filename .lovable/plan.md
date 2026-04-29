# Diagnóstico: usuários funcionários da Seven que não aparecem corretamente

## Causa raiz encontrada

Investiguei o caso da **Aline Daloso (aline@sevengroup360.com.br)** e descobri:

1. A Aline **existe** no sistema (`profiles`) com `is_active = true` e `tipo_vinculo = funcionario_seven`.
2. O problema é que ela tem **2 roles atribuídos** simultaneamente em `user_roles`:
   - `corretor` (criado em 13:49, no autoregistro original)
   - `gestor_produto` (criado em 14:36, quando o admin tentou recadastrá-la)

3. Quando o sistema lê o role do usuário, ele faz `.limit(1).maybeSingle()` (em `AuthContext`, `usePermissions`, `Usuarios.tsx`, etc.) — ou seja, pega **apenas o primeiro role** retornado, sem critério determinístico. Isso explica por que ela aparece como "corretor" em algumas telas, e por que filtros que esperam `gestor_produto`/`funcionario_seven` (como o `useFuncionariosSeven`, `useGestores`, seletores de responsáveis) podem ocultá-la.

### Por que isso aconteceu

A edge function `create-user` tem este fluxo quando o e-mail já existe:

```text
1. Detecta email duplicado → recupera user_id existente
2. Atualiza profile (OK)
3. Verifica se já tem o role pretendido → NÃO TEM (ela só tinha corretor)
4. INSERE o novo role (gestor_produto)  ← BUG: não remove os roles antigos
```

Resultado: usuário fica com 2 roles, e o sistema fica inconsistente.

Confirmei que **apenas a Aline** está nessa situação hoje (1 caso), mas o bug afetará qualquer próximo recadastro com troca de role.

---

## Plano de correção

### 1. Corrigir os dados da Aline (migration SQL)

Remover o role antigo `corretor`, mantendo apenas `gestor_produto` (que é o role correto solicitado pelo admin):

```sql
DELETE FROM user_roles
WHERE user_id = 'ff846b8c-c5b5-47c2-8350-4b136680f356'
  AND role_id = (SELECT id FROM roles WHERE name = 'corretor');
```

### 2. Corrigir a edge function `create-user`

Antes de inserir o novo role para um usuário existente, **remover todos os roles anteriores** desse usuário, garantindo que cada usuário tenha exatamente 1 role ativo:

```ts
// Antes do insert do novo role:
await supabaseAdmin
  .from('user_roles')
  .delete()
  .eq('user_id', newUserId)
  .neq('role_id', roleData.id);  // remove todos exceto o novo
```

Isso torna o recadastro idempotente: chamar `create-user` com um role diferente passa a **substituir** o role antigo em vez de acumular.

### 3. (Opcional, mas recomendado) Constraint única no banco

Adicionar constraint para impedir múltiplos roles por usuário no futuro:

```sql
-- Antes: garantir que não há duplicatas
-- Depois:
ALTER TABLE user_roles
ADD CONSTRAINT user_roles_user_id_unique UNIQUE (user_id);
```

> **Atenção**: o sistema atual assume "1 role por usuário" em vários hooks (`AuthContext`, `usePermissions`, `Usuarios.tsx` — todos usam `.limit(1)`). A constraint apenas formaliza essa regra.
> 
> Vou verificar se existe alguma migration ou tela que dependa de múltiplos roles antes de aplicar a constraint. Se houver, pulo este passo 3.

---

## Resultado esperado

- A Aline passa a aparecer corretamente como **gestor_produto** em todo o sistema (seletores de gestor, lista de funcionários Seven, permissões de menu, etc.).
- Próximos recadastros via tela de Usuários não criarão mais roles duplicados.
- A tela de Usuários (`/usuarios`) continua exibindo todos os usuários — ela já lista todos os profiles independentemente do role.

## Sem alterações necessárias

- `Usuarios.tsx`, `AuthContext`, `usePermissions`: a lógica de `.limit(1)` continua válida pois passa a refletir a regra "1 role por usuário".
- `useFuncionariosSeven`: o filtro `tipo_vinculo = 'funcionario_seven'` está correto.
