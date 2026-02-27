
# Adicionar disparo de webhook ao enviar comentário em propostas

## Situacao atual

O hook `useAddNegociacaoComentario` (usado tanto pelo time interno quanto pelo portal do incorporador) faz o insert do comentario e invalida o cache, mas nao dispara nenhum webhook. O evento tambem nao existe na lista de eventos disponiveis em `WEBHOOK_EVENTS`.

## Implementacao

### 1. Registrar novo evento na lista de webhooks

**Arquivo:** `src/hooks/useWebhooks.ts`

Adicionar o evento na lista `WEBHOOK_EVENTS`:
```
{ value: 'comentario_proposta', label: 'Comentario em Proposta (Negociacao)' }
```

### 2. Disparar webhook apos envio do comentario

**Arquivo:** `src/hooks/useNegociacaoComentarios.ts`

No `onSuccess` do `useAddNegociacaoComentario`:
- Importar `dispararWebhook` e `getUsuarioLogado` de `@/lib/webhookUtils`
- Disparar o evento `comentario_proposta` com payload contendo:
  - `negociacao_id`
  - `comentario` (texto enviado)
  - `autor` (nome e id do usuario logado)
  - `origem` (identificar se veio do portal do incorporador ou do sistema interno, usando o role do usuario)

### Detalhes tecnicos

O disparo e "fire-and-forget" (nao bloqueia UX), seguindo o padrao ja existente no projeto via `dispararWebhook`. O webhook-dispatcher ja esta pronto para receber qualquer evento — basta cadastrar a URL no painel de configuracoes para o evento `comentario_proposta`.

| Arquivo | Mudanca |
|---------|---------|
| `src/hooks/useWebhooks.ts` | Adicionar evento `comentario_proposta` na lista `WEBHOOK_EVENTS` |
| `src/hooks/useNegociacaoComentarios.ts` | Disparar webhook no `onSuccess` do mutation |
