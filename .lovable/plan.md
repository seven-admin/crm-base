## Diagnóstico

A exclusão ainda falhou porque os usuários Tânia Moraes, Joel, Lucas, Michel e Pedro continuam referenciados em `seven_clientes.gestor_id`.

O `delete-user` tenta zerar esse campo antes de excluir, mas o `UPDATE` em `seven_clientes` está sendo bloqueado pelo trigger `validate_nivel_cadastro_cliente()`. Esse trigger revalida dados obrigatórios do cliente mesmo quando a alteração é só administrativa (`gestor_id = null`). Como há clientes antigos/incompletos, o cleanup falha e o Auth não consegue apagar o `profile`.

## Plano de correção

1. Ajustar a função `validate_nivel_cadastro_cliente()` no banco
   - Manter a validação normal para criação/edição real de clientes.
   - Em `UPDATE`, ignorar validação quando a alteração for apenas em campos administrativos como `gestor_id`, `created_by`, `updated_at` ou similares.
   - Isso evita que uma rotina de limpeza seja bloqueada por dados legados incompletos.

2. Melhorar a Edge Function `delete-user`
   - Antes do `auth.admin.deleteUser`, continuar limpando referências.
   - Se alguma limpeza crítica falhar, retornar a mensagem exata por tabela/campo em vez de apenas `AuthRetryableFetchError`.
   - Tratar `seven_clientes.gestor_id` como referência crítica, para facilitar diagnóstico futuro.

3. Remover as atribuições atuais dos usuários que falharam
   - Zerar `seven_clientes.gestor_id` para os usuários informados que ainda ficaram presos:
     - Tânia Moraes
     - Joel
     - Lucas
     - Michel
     - Pedro
   - Confirmar que não restam referências bloqueantes em FKs sem `ON DELETE SET NULL`.

4. Validar
   - Consultar novamente as referências desses usuários em `seven_clientes.gestor_id`.
   - Conferir logs do `delete-user` após a alteração.
   - A partir daí, a exclusão desses gestores deve funcionar pela tela de Usuários.