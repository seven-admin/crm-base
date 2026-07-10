## Problema

Em `/arqo/config` → aba **Grupos** → "Membros do grupo", o seletor "Usuário" fica vazio porque busca por `profiles.empresa = 'arqo'`, mas **nenhum profile tem `empresa='arqo'`** hoje — todos estão como `seven`. A segmentação por empresa nunca foi preenchida para usuários Arqo.

Por outro lado, já existem as roles corretas: `arqo_admin`, `arqo_gestor`, `arqo_consultor`, `arqo_closer`.

## Solução

Trocar o critério do seletor de membros para filtrar por **roles Arqo**, não por `empresa`.

### Mudanças

1. **`src/hooks/useFuncionariosSeven.ts`**
   - Adicionar novo hook `useProfilesByRoles(roleNames: string[])` que consulta `profiles` fazendo join com `user_roles` + `roles`, retornando usuários ativos que possuam qualquer uma das roles informadas.

2. **`src/components/arqo/ArqoGrupoMembros.tsx`**
   - Substituir `useProfilesByEmpresa('arqo')` por `useProfilesByRoles(['arqo_admin','arqo_gestor','arqo_consultor','arqo_closer'])`.
   - Se o super admin precisar aparecer também, incluir `super_admin` na lista (proponho incluir para não travar o cadastro em ambiente inicial).

### Fora de escopo
- Não vou popular retroativamente `profiles.empresa='arqo'` — a role já é a fonte de verdade correta para "quem é da Arqo".
- Sem migration; mudança 100% frontend.