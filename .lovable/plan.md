
# Paginacao e limpeza automatica de logs de webhook

## O que sera feito

1. **Paginacao no historico de disparos** -- o hook `useWebhookLogs` passara a usar paginacao server-side (com `count: 'exact'` e `range`), e o componente `WebhookLogsSection` exibira controles de pagina usando o `PaginationControls` ja existente no projeto.

2. **Botao para limpar logs antigos** -- um botao "Limpar antigos" na barra de ferramentas que apaga logs anteriores ao mes corrente (via edge function, pois DELETE precisa de service_role).

3. **Rotina automatica (cron)** -- um job `pg_cron` que executa mensalmente a limpeza de logs anteriores ao primeiro dia do mes corrente.

## Arquivos impactados

| Arquivo | Mudanca |
|---------|---------|
| `src/hooks/useWebhooks.ts` | Alterar `useWebhookLogs` para aceitar `page`/`pageSize`, retornar `{ logs, total, page, totalPages }`. Adicionar mutation `useCleanOldWebhookLogs`. |
| `src/components/configuracoes/WebhookLogsSection.tsx` | Adicionar estado de pagina, usar `PaginationControls`, adicionar botao "Limpar antigos" com confirmacao. |
| `supabase/functions/cleanup-webhook-logs/index.ts` | Nova edge function que deleta logs com `created_at < primeiro dia do mes corrente` usando service_role. |
| Migration SQL | Habilitar `pg_cron` + `pg_net` e criar job mensal para invocar a edge function de limpeza. |

## Detalhes tecnicos

### Paginacao (useWebhookLogs)

```text
useWebhookLogs(webhookId?, page = 1, pageSize = 20)
  -> select('*', { count: 'exact' })
  -> .range(from, to)
  -> retorna { logs, total, page, totalPages }
```

### Edge function cleanup-webhook-logs

- Recebe POST com `service_role` auth
- Executa DELETE em `webhook_logs` onde `created_at < date_trunc('month', now())`
- Retorna quantidade de registros removidos

### Cron job

- Frequencia: todo dia 1 de cada mes as 03:00 UTC
- Chama a edge function `cleanup-webhook-logs` via `net.http_post`
