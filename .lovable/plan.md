

# Correção: NEG-00206 não move para "Proposta completa"

## Diagnóstico

No `FunilKanbanBoard.tsx` (linha 238-244), existe uma validação de drag-and-drop:

```typescript
const ETAPA_ANALISE_PROPOSTA = 'ed1b1eb4-2cf1-4cf3-ac62-2a8897a52f35';

if (destinationColumn === ETAPA_ANALISE_PROPOSTA && !negociacao.numero_proposta) {
  toast.info('Gere uma proposta para enviar para análise.');
  navigate(`/negociacoes/editar/${negociacao.id}`);
  return; // ← BLOQUEIA a movimentação
}
```

A etapa `ed1b1eb4-...` é a **"Proposta completa"** (ordem 3). A NEG-00206 tem `numero_proposta = null`, então o código **bloqueia** a movimentação e redireciona para a edição, sem erro visível — apenas um toast sutil.

O problema é que esta validação faz sentido para o fluxo normal (gestor movendo para análise), mas **não faz sentido** quando:
- O incorporador está aprovando/movendo após "Retorno do incorporador"
- Ou o gestor quer registrar a aprovação do incorporador manualmente

## Solução

### 1. `src/components/negociacoes/FunilKanbanBoard.tsx`
Ajustar a validação para permitir a movimentação quando a negociação **já passou** pela etapa "Retorno do incorporador" (ou seja, já foi analisada):

```typescript
const ETAPA_ANALISE_PROPOSTA = 'ed1b1eb4-2cf1-4cf3-ac62-2a8897a52f35';
const ETAPA_RETORNO_INCORPORADOR = '0ce3c47e-b603-4f62-8205-8ff9931452c1';

if (
  destinationColumn === ETAPA_ANALISE_PROPOSTA && 
  !negociacao.numero_proposta &&
  sourceColumn !== ETAPA_RETORNO_INCORPORADOR  // ← permite se vem do retorno
) {
  toast.info('Gere uma proposta para enviar para análise.');
  navigate(`/negociacoes/editar/${negociacao.id}`);
  return;
}
```

Isso resolve o caso imediato. Negociações vindas de "Retorno do incorporador" (como a NEG-00206) poderão ser movidas para "Proposta completa" sem bloqueio.

### Detalhes técnicos
- Apenas 1 arquivo alterado: `src/components/negociacoes/FunilKanbanBoard.tsx`
- Mudança de ~2 linhas na condição do `if`
- Sem alteração de banco de dados
- A validação continua ativa para o fluxo normal (etapas iniciais → Proposta completa sem proposta gerada)

### Validação
- Arrastar NEG-00206 de "Retorno do incorporador" para "Proposta completa" — deve funcionar
- Arrastar uma negociação de "Atendimento" para "Proposta completa" sem proposta — deve continuar bloqueando

