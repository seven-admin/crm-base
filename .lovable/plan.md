

# Cronômetro em todas as atividades

## Mudança

Uma única linha: remover a restrição de tipos no `TIPOS_COM_CRONOMETRO`, fazendo-o incluir todos os tipos de atividade.

### `src/types/atividades.types.ts`
Alterar a constante para incluir todos os tipos:
```typescript
export const TIPOS_COM_CRONOMETRO: AtividadeTipo[] = [
  'ligacao', 'meeting', 'reuniao', 'visita', 'atendimento',
  'fechamento', 'assinatura', 'acompanhamento', 'treinamento',
  'administrativa', 'negociacao', 'contra_proposta_atividade'
];
```

Nenhuma outra alteração necessária — o `AtividadeDetalheDialog` e a página `Atividades` já usam essa constante para decidir se exibem o cronômetro. Ao incluir todos os tipos, ele aparece em todas as atividades automaticamente.

