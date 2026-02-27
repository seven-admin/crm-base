

# Corrigir filtro de propostas e botoes no Portal do Incorporador

## Problema

Duas questoes relacionadas:
1. Propostas desaparecem do portal quando o status muda para `rascunho` ou `enviada` (fora do filtro atual)
2. Quando uma proposta retorna para analise apos contra-proposta (status volta para `em_analise` via `useReenviarParaAnalise`), os botoes de Aprovar/Contra Proposta nao aparecem

## Solucao

Alterar o arquivo `src/pages/portal-incorporador/PortalIncorporadorPropostas.tsx`:

### 1. Ampliar filtro "Aguardando Aprovacao" (com botoes)

Manter propostas com `status_proposta === 'em_analise'` -- isso ja cobre o cenario de reenvio, pois `useReenviarParaAnalise` seta o status de volta para `em_analise`. O `showActions={true}` ja esta correto nesta secao. Adicionar tambem o fallback da etapa sem status.

### 2. Nova secao "Em Preparacao" (sem botoes)

Filtrar propostas com `status_proposta` em `['rascunho', 'enviada']` que possuam `numero_proposta` preenchido. Exibir com `showActions={false}` e badge informativo do status atual.

### 3. Verificacao explicita para reenvio apos contra-proposta

A logica atual coloca propostas com `status_proposta === 'contra_proposta'` na secao "Propostas Recentes" (sem botoes). Quando o time interno reenvia, o status muda para `em_analise` e a proposta DEVE migrar para "Aguardando Aprovacao" COM botoes.

O problema potencial: se o cache do React Query nao invalidou corretamente, a proposta pode permanecer na secao errada. Para garantir:
- Confirmar que o filtro de `propostasResolvidas` NAO captura `em_analise` (ja esta correto no codigo atual)
- Confirmar que `propostasEmAnalise` captura `em_analise` independente de historico anterior (ja esta correto)
- Adicionar `refetchInterval` ou `refetchOnWindowFocus: true` ao `useNegociacoes` do portal para garantir que mudancas feitas pelo time interno reflitam rapidamente no portal do incorporador

### 4. Secao "Propostas Recentes" (sem botoes)

Manter como esta: `aprovada_incorporador` e `contra_proposta`.

## Arquivo impactado

| Arquivo | Mudanca |
|---------|---------|
| `src/pages/portal-incorporador/PortalIncorporadorPropostas.tsx` | Ampliar filtros, adicionar secao "Em Preparacao", adicionar `refetchInterval` para atualizar dados automaticamente |

## Detalhes tecnicos

```text
Fluxo de status e visibilidade no portal:

rascunho ──► "Em Preparacao" (sem botoes)
enviada ──► "Em Preparacao" (sem botoes)
em_analise ──► "Aguardando Aprovacao" (COM botoes: Aprovar / Contra Proposta)
contra_proposta ──► "Propostas Recentes" (sem botoes)
  └── time interno reenvia ──► em_analise ──► volta para "Aguardando Aprovacao" COM botoes
aprovada_incorporador ──► "Propostas Recentes" (sem botoes)
```

- Adicionar `refetchInterval: 30000` (30s) ao hook para que o portal atualize automaticamente quando o time interno reenvia uma proposta
- Cards na secao "Em Preparacao" exibem badge com o status atual (Rascunho/Enviada) para o incorporador acompanhar o progresso

