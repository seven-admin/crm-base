
## Diagnóstico

O `delete-user` continua falhando para gestores de produto porque existem FKs para `public.profiles(id)` **sem** `ON DELETE SET NULL/CASCADE`. Ao excluir o profile (cascata do `auth.users`), o Postgres bloqueia. Colunas hoje bloqueantes:

- `seven_empreendimentos.responsavel_comercial_id`
- `seven_empreendimento_documentos.created_by`
- `seven_empreendimento_corretores.autorizado_por`
- `seven_empreendimento_imobiliarias.autorizado_por`
- `seven_clientes.gestor_id` e `seven_clientes.created_by`
- `seven_lancamentos_financeiros.created_by` e `conferido_por`
- `seven_saldos_mensais.created_by`

Como você pediu para não mexer nas tabelas, a solução é fazer **nullify preventivo** nessas colunas dentro da edge function antes do `auth.admin.deleteUser`.

## 1. Ampliar `supabase/functions/delete-user/index.ts`

Adicionar ao `cleanupReferences` (mantendo os steps atuais) o nullify de:

- `seven_empreendimentos.responsavel_comercial_id`
- `seven_empreendimento_documentos.created_by`
- `seven_empreendimento_corretores.autorizado_por`
- `seven_empreendimento_imobiliarias.autorizado_por`
- `seven_lancamentos_financeiros.created_by`
- `seven_lancamentos_financeiros.conferido_por`
- `seven_saldos_mensais.created_by`
- `arqo_agendamentos.responsavel_id`
- `nexa_visitas_eventos.usuario_id`

Depois disso o cascade do delete no auth resolve o restante (as demais FKs já estão `SET NULL`/`CASCADE`).

## 2. Remover atribuições de responsável por empreendimento (UI)

Estender `src/components/usuarios/UserEmpreendimentosTab.tsx` (já lista os empreendimentos vinculados via `sistema_user_empreendimentos`) para também mostrar e permitir **remover** a atribuição de "Responsável Comercial":

- Novo hook (ou extensão de `useUserEmpreendimentos`) que consulta `seven_empreendimentos` onde `responsavel_comercial_id = user_id`.
- Nova seção "Responsável Comercial" na aba, listando esses empreendimentos com botão "Remover responsabilidade" que faz `update seven_empreendimentos set responsavel_comercial_id = null where id = ?`.
- Manter a seção existente de `sistema_user_empreendimentos` (vínculo de acesso) como está, apenas separada visualmente.

Acesso: restrito ao super admin, seguindo o padrão do resto da aba.

## Ordem de execução

1. Ampliar `delete-user/index.ts` com os nullifies acima.
2. Ajustar `UserEmpreendimentosTab.tsx` + hook para exibir/remover responsabilidade comercial.

Sem migrações. Sem mudanças de schema.
