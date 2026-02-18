
## Mudança

Remover o `Badge` com a contagem numérica do canto superior direito da célula do dia no calendário (`PlanejamentoCalendario.tsx`), já que o texto `+N mais` no rodapé da célula já informa essa contagem de forma contextual.

### Arquivo modificado

- **`src/components/planejamento/PlanejamentoCalendario.tsx`** — remover as linhas 235–239:

```tsx
// REMOVER:
{hasItems && (
  <Badge variant="secondary" className="text-xs h-5 px-1.5">
    {dayItems.length}
  </Badge>
)}
```

Após a remoção, o cabeçalho da célula terá apenas o número do dia, sem nenhum número adicional que cause confusão.
