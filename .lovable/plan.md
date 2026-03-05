

# Plano: Corrigir lista de eventos no dropdown de Webhooks

## Diagnose

Comparei os eventos listados no `WEBHOOK_EVENTS` (dropdown das configurações) com os eventos **realmente disparados** no código (`dispararWebhook('...')`) e encontrei discrepâncias significativas.

### Eventos disparados no código mas AUSENTES no dropdown

| Evento | Onde é disparado |
|---|---|
| `corretor_cadastrado` | `useGestorCorretores.ts` — novo cadastro de corretor |
| `imobiliaria_atualizada` | `useImobiliarias.ts` — edição de imobiliária |
| `proposta_em_analise` | `useNegociacoes.ts` — proposta enviada para análise |
| `proposta_aprovada_incorporador` | `useNegociacoes.ts` — incorporador aprova proposta |
| `proposta_contra_proposta` | `useNegociacoes.ts` — contra-proposta do incorporador |
| `negociacao_movida` | `useNegociacoes.ts` — transição de etapa no funil |

### Eventos no dropdown que NÃO são disparados em nenhum lugar do código

| Evento | Observação |
|---|---|
| `ticket_aguardando_analise` | Nunca chamado — tickets usam apenas `atividade_comentada` |
| `ticket_ajuste` | Idem |
| `ticket_aprovacao_cliente` | Idem |
| `ticket_concluido` | Idem |
| `ticket_em_producao` | Idem |
| `ticket_revisao` | Idem |
| `assinatura_enviada` | `SignatariosManager` usa webhook próprio direto para n8n, não passa pelo dispatcher |
| `briefing_triado` | Nunca chamado |
| `contrato_assinado` | Nunca chamado |
| `contrato_gerado` | Nunca chamado |
| `lead_convertido` | Nunca chamado |
| `negociacao_criada` | Nunca chamado |
| `negociacao_fechada` | Nunca chamado |
| `negociacao_perdida` | Nunca chamado |
| `reserva_criada` | Nunca chamado |

## Solução

### 1. Atualizar `WEBHOOK_EVENTS` em `src/hooks/useWebhooks.ts`

Adicionar os 6 eventos faltantes que são realmente disparados. Manter os eventos "planejados" (como `negociacao_criada`, `contrato_gerado`, etc.) pois podem ser úteis futuramente, mas marcar como referência. A lista corrigida:

```
// Eventos ativos (disparados no código)
corretor_cadastrado           — Corretor Cadastrado (Novo Cadastro)
corretor_aprovado             — Corretor Aprovado (Ativação)
imobiliaria_cadastrada        — Imobiliária Cadastrada
imobiliaria_atualizada        — Imobiliária Atualizada
atividade_comentada           — Atividade Comentada (Marketing / Forecast)
atividade_criada_por_superadmin — Atividade Criada por Super Admin
comentario_proposta           — Comentário em Proposta (Negociação)
meta_comercial_criada         — Meta Comercial Criada
negociacao_movida             — Negociação Movida (Transição de Etapa)
proposta_em_analise           — Proposta Enviada para Análise
proposta_aprovada_incorporador — Proposta Aprovada pelo Incorporador
proposta_contra_proposta      — Contra-Proposta do Incorporador
assinatura_enviada            — Assinatura Enviada (Webhook n8n)

// Eventos planejados (ainda não disparados no código)
briefing_triado, contrato_assinado, contrato_gerado,
lead_convertido, negociacao_criada, negociacao_fechada,
negociacao_perdida, reserva_criada,
ticket_* (6 eventos de produção)
```

Os eventos `ticket_*` serão removidos da lista por agora pois o sistema de tickets não os dispara — ele usa apenas `atividade_comentada`. Os demais eventos planejados permanecerão para uso futuro.

## Arquivo afetado

| Arquivo | Alteração |
|---|---|
| `src/hooks/useWebhooks.ts` | Atualizar array `WEBHOOK_EVENTS` |

