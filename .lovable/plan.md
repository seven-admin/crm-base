
## Adicionar Frequência Semanal na Recorrência Financeira

### O problema

A função `generateRecurringDates` em `useFinanceiro.ts` usa exclusivamente `addMonths` para gerar as datas das parcelas recorrentes. A frequência `semanal` opera em **semanas**, não em meses, então requer tratamento especial com `addWeeks` (disponível no `date-fns`).

### Arquivos que serão modificados

**1. `src/types/financeiro.types.ts`**

Adicionar `'semanal'` ao tipo `RecorrenciaFrequencia` e aos dois objetos de mapeamento:

```ts
// Antes:
export type RecorrenciaFrequencia = 'mensal' | 'bimestral' | 'trimestral' | 'semestral' | 'anual';

// Depois:
export type RecorrenciaFrequencia = 'semanal' | 'mensal' | 'bimestral' | 'trimestral' | 'semestral' | 'anual';
```

Adicionar nos labels:
```ts
export const RECORRENCIA_LABELS = {
  semanal: 'Semanal',
  mensal: 'Mensal',
  // ...
};
```

O objeto `RECORRENCIA_MESES` não serve para semanas — será tratado na lógica da função de geração.

**2. `src/hooks/useFinanceiro.ts`**

- Importar `addWeeks` do `date-fns` (além do `addMonths` já existente).
- Reescrever `generateRecurringDates` para distinguir entre frequência semanal e as demais (mensais):

```ts
import { addMonths, addWeeks, endOfYear, format } from 'date-fns';

function generateRecurringDates(startDate: string, frequencia: RecorrenciaFrequencia): string[] {
  const dates: string[] = [];
  const start = new Date(startDate);
  const endYear = endOfYear(new Date(start.getFullYear(), 11, 31));

  let currentDate = start;

  if (frequencia === 'semanal') {
    while (currentDate <= endYear) {
      dates.push(format(currentDate, 'yyyy-MM-dd'));
      currentDate = addWeeks(currentDate, 1);
    }
  } else {
    const intervalMonths = RECORRENCIA_MESES[frequencia];
    while (currentDate <= endYear) {
      dates.push(format(currentDate, 'yyyy-MM-dd'));
      currentDate = addMonths(currentDate, intervalMonths);
    }
  }

  return dates;
}
```

### Consideração importante sobre volume

A frequência semanal pode gerar **até ~52 lançamentos por ano** ao invés dos ~12 do mensal. Isso é esperado e correto — o sistema já insere em lote, então não há problema técnico.

### Resumo das mudanças

| Arquivo | O que muda |
|---|---|
| `src/types/financeiro.types.ts` | Adiciona `'semanal'` ao tipo e labels |
| `src/hooks/useFinanceiro.ts` | Importa `addWeeks`, lógica condicional na geração de datas |

Nenhuma migração de banco de dados é necessária — o campo `recorrencia_frequencia` já é `text` (string livre), então aceita `'semanal'` sem alteração de schema.
