

## Abreviacao dos Dias da Semana na Timeline

### Problema
No zoom "Dia", o sublabel usa `format(date, 'EEE')` que gera abreviacoes como "seg", "ter", "qua" -- texto largo demais para as celulas de 32px, quebrando o layout.

### Solucao

**Arquivo: `src/components/planejamento/PlanejamentoTimeline.tsx`**

Substituir o `format(date, 'EEE', { locale: ptBR })` na linha 91 por um mapeamento manual de iniciais:

```
const DAY_INITIALS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
```

E usar `DAY_INITIALS[date.getDay()]` como sublabel no modo dia.

Isso garante que cada celula mostre apenas uma letra (D, S, T, Q, Q, S, S) sem quebra de texto.

