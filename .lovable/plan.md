

# Corrigir bug de data (1 dia a menos) em Eventos

## Problema
Quando o banco retorna `"2026-03-15"` (string date-only), `new Date("2026-03-15")` interpreta como **UTC midnight**. No fuso brasileiro (UTC-3), isso vira **14/03 às 21h** — exibindo um dia a menos.

## Solução
Substituir `new Date(data_evento)` por `parseISO(data_evento)` do date-fns em todos os arquivos. O `parseISO` também interpreta como UTC para date-only strings, então a correção real é usar uma função helper que force horário local:

```typescript
// Helper: parseDateLocal("2026-03-15") → new Date(2026, 2, 15) em horário local
function parseDateLocal(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}
```

Criar este helper em `src/lib/utils.ts` e substituir todas as ocorrências.

## Arquivos afetados (6 arquivos, ~12 ocorrências)

| Arquivo | Linhas |
|---------|--------|
| `src/lib/utils.ts` | Adicionar `parseDateLocal` |
| `src/components/eventos/EventoCard.tsx` | L32 |
| `src/components/eventos/EventosCalendario.tsx` | L75 |
| `src/pages/Eventos.tsx` | L144, L236, L313 |
| `src/pages/EventoDetalhe.tsx` | L82 |
| `src/pages/EventosCalendario.tsx` | L38, L55 |
| `src/pages/portal/PortalEventos.tsx` | L134 |

## Mudança em cada arquivo
Importar `parseDateLocal` de `@/lib/utils` e substituir `new Date(evento.data_evento)` ou `new Date(data.data_evento)` por `parseDateLocal(evento.data_evento)`.

