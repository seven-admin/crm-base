## Diagnóstico

O usuário `atendimento@nexaresolve.com.br` está ativo e possui vínculo com a role `nexa_gestor`. A role também tem permissões cadastradas no banco para `dashboard`, `agenda`, `contratos`, `empreendimentos`, `reservas` e `unidades`.

O problema está no frontend: `usePermissions.ts` busca permissões pelo relacionamento `roles -> sistema_role_permissions`, mas esse relacionamento antigo usa a coluna enum `role`. As novas roles como `nexa_gestor` não existem no enum `app_role`, então as permissões gravadas por `role_id` não entram no hook. Resultado: o sistema entende que o usuário não tem permissões e redireciona para `/sem-acesso`.

## Plano de correção

1. **Corrigir o hook de permissões**
   - Alterar `src/hooks/usePermissions.ts` para buscar a role atual em `roles` pelo `name`.
   - Buscar `sistema_role_permissions` diretamente por `role_id`, não pelo enum `role`.
   - Manter os overrides por usuário em `sistema_user_module_permissions` com prioridade sobre a role.

2. **Corrigir funções auxiliares que ainda usam role enum**
   - Revisar hooks de gerenciamento de roles/permissões que consultam ou salvam `sistema_role_permissions`.
   - Padronizar novas permissões para sempre gravarem `role_id`.
   - Não depender mais de `role::app_role` para roles novas como `nexa_gestor`, `arqo_consultor`, etc.

3. **Ajustar fallback da edge function `create-user`**
   - Confirmar que o fallback já grava `role_id` no dashboard.
   - Se necessário, manter compatibilidade sem tentar gravar a coluna enum `role` para roles que não existem no enum.

4. **Validar o caso real**
   - Verificar que `atendimento@nexaresolve.com.br` passa a carregar permissões do `nexa_gestor`.
   - Confirmar que o acesso inicial redireciona para `/nexa/agenda` em vez de `/sem-acesso`.
   - Garantir que super_admin continua vendo todo o sistema.

## Resultado esperado

Usuários criados com roles modernas (`nexa_*`, `arqo_*`, etc.) deixam de cair em “Acesso Pendente” quando já possuem permissões em `sistema_role_permissions.role_id`.