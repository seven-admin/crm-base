

# Webhook de Atividade: Disparar na Criacao e na Alteracao

## Situacao Atual

O webhook `atividade_criada_por_superadmin` so e disparado em dois locais:
- `useCreateAtividade` (linha 209) - criacao individual
- `useCreateAtividadesParaGestores` (linha 260) - criacao em lote

O hook `useUpdateAtividade` (linha 283-300) **nao dispara nenhum webhook**. Isso significa que quando um super admin edita uma atividade existente, nenhuma notificacao e enviada via webhook.

## Alteracao

**Arquivo: `src/hooks/useAtividades.ts`**

Adicionar disparo de webhook no `useUpdateAtividade` (mutationFn, apos o update bem-sucedido):

1. Verificar se o usuario logado e super_admin
2. Se sim, buscar dados complementares (perfil do criador, gestor atribuido, empreendimento)
3. Disparar webhook com evento `atividade_alterada_por_superadmin` (evento distinto para que o n8n possa diferenciar criacao de alteracao)
4. O payload seguira o mesmo formato do webhook de criacao, incluindo: titulo, criado_por, gestores, data_inicio, data_fim, tipo, empreendimento

Tambem adicionar o disparo no `useAlterarStatusAtividade` (linha 576-633), que e usado quando o super admin altera o status de uma atividade. Neste caso o evento sera o mesmo `atividade_alterada_por_superadmin` e incluira o campo adicional `status_anterior` e `status_novo`.

### Resumo dos disparos apos a alteracao

| Hook | Evento webhook |
|------|---------------|
| `useCreateAtividade` | `atividade_criada_por_superadmin` (ja existe) |
| `useCreateAtividadesParaGestores` | `atividade_criada_por_superadmin` (ja existe) |
| `useUpdateAtividade` | `atividade_alterada_por_superadmin` (novo) |
| `useAlterarStatusAtividade` | `atividade_alterada_por_superadmin` (novo) |

Nenhuma alteracao de banco de dados ou edge function necessaria - o `webhook-dispatcher` ja aceita qualquer nome de evento e faz o match com os webhooks cadastrados na tabela `webhooks`.

