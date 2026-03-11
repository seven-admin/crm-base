

# Alterar validações do Forecast: permitir movimentação livre até Proposta

## Situação atual

No `FunilKanbanBoard.tsx` (linhas 246-259), existem dois bloqueios ao arrastar cards no Kanban:

1. **Bloqueio 1**: Não pode sair da etapa inicial (Atendimento) sem ter proposta gerada
2. **Bloqueio 2**: Não pode ir para qualquer etapa não-inicial sem proposta

Isso impede que um atendimento avance para "Negociação" sem cadastro completo e proposta.

## Alteração proposta

Flexibilizar a movimentação para que cards possam transitar livremente entre etapas intermediárias (Atendimento → Negociação → etc.) **sem exigir proposta**. A validação de proposta obrigatória só será aplicada quando:

- Mover para a etapa **"Análise de Proposta"** (ID: `ed1b1eb4-2cf1-4cf3-ac62-2a8897a52f35`)
- Mover para etapas finais (Ganho/Perda)

## Arquivo alterado

**`src/components/negociacoes/FunilKanbanBoard.tsx`**

Substituir os bloqueios das linhas 246-259 por:

```typescript
// Bloqueio: só exige proposta para Análise de Proposta e etapas finais
const ETAPA_ANALISE_PROPOSTA = 'ed1b1eb4-2cf1-4cf3-ac62-2a8897a52f35';

if (destinationColumn === ETAPA_ANALISE_PROPOSTA && !negociacao.numero_proposta) {
  setSelectedNegociacao(negociacao);
  setPropostaMode('gerar');
  setPropostaOpen(true);
  toast.info('Gere uma proposta para enviar para análise.');
  return;
}
```

As etapas finais (Ganho/Perda) já são tratadas pelo bloco existente na linha 262 que abre o dialog de mover — não requerem alteração.

Nenhuma outra mudança necessária. O fluxo de validação completa (CPF, email, estado civil, etc.) continua sendo exigido apenas no `useSolicitarReserva` via RPC `verificar_ficha_proposta_completa`.

