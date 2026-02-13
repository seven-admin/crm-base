

# Webhook de Alteracao de Atividade nao Dispara

## Diagnostico

O codigo de disparo esta correto no `useUpdateAtividade`. O problema e que na tabela `webhooks` so existe um registro para o evento `atividade_criada_por_superadmin`, mas **nenhum** para `atividade_alterada_por_superadmin`.

O `webhook-dispatcher` faz match exato pelo nome do evento -- se nao ha webhook cadastrado para `atividade_alterada_por_superadmin`, ele simplesmente retorna "nenhum webhook configurado" e nao dispara nada.

## Opcoes

Existem duas formas de resolver:

**Opcao A (Recomendada)** - Usar o mesmo evento `atividade_criada_por_superadmin` tanto para criacao quanto alteracao, adicionando um campo `acao` no payload (`"criada"` ou `"alterada"`). Assim o webhook ja cadastrado passa a receber ambos os disparos sem nenhuma configuracao adicional.

**Opcao B** - Manter eventos separados. Nesse caso, basta o usuario cadastrar um novo webhook em Configuracoes com o evento `atividade_alterada_por_superadmin` apontando para a mesma URL do n8n. Nenhuma alteracao de codigo seria necessaria.

## Plano (Opcao A)

### Arquivo: `src/hooks/useAtividades.ts`

1. No `useUpdateAtividade` (linha 306): trocar o evento de `atividade_alterada_por_superadmin` para `atividade_criada_por_superadmin` e adicionar o campo `acao: 'alterada'` ao payload.

2. No `useAlterarStatusAtividade`: mesma mudanca -- usar `atividade_criada_por_superadmin` com `acao: 'status_alterado'`.

3. Nos hooks de criacao (`useCreateAtividade` e `useCreateAtividadesParaGestores`): adicionar `acao: 'criada'` ao payload para que o n8n consiga diferenciar.

### Arquivo: `src/hooks/useWebhooks.ts`

Remover o evento `atividade_alterada_por_superadmin` da lista `WEBHOOK_EVENTS`, ja que nao sera mais necessario como evento separado.

### Resultado

Todos os disparos (criacao, edicao, mudanca de status) usarao o mesmo evento `atividade_criada_por_superadmin` que ja esta cadastrado e ativo com a URL do n8n. O campo `acao` no payload permite ao n8n diferenciar o tipo de operacao.

