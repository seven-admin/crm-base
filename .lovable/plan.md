
# Adicionar tooltip contextual ao TemperaturaSelector

## Objetivo
Exibir um texto explicativo sobre o significado da temperatura, que muda conforme o contexto de uso:
- **Atividades**: "Proximidade com o parceiro"
- **Negociações**: "Proximidade com a próxima etapa"

## Solução

### Arquivo: `src/components/atividades/TemperaturaSelector.tsx`

1. Adicionar uma nova prop `context` ao componente:
```tsx
context?: 'atividade' | 'negociacao';
```

2. Quando `context` for informado, exibir um icone de info (lucide `Info`) ao lado do seletor, envolto em um `Tooltip` (já disponível em `@/components/ui/tooltip`), com o texto correspondente:
   - `'atividade'` → "Proximidade com o parceiro"
   - `'negociacao'` → "Proximidade com a próxima etapa"

3. No `displayMode`, o tooltip fica no `PopoverContent` como texto auxiliar acima das opções. No modo inline, fica como um pequeno icone `Info` ao lado dos badges.

### Uso nos chamadores

Atualizar os principais pontos de uso para passar a prop `context`:
- `src/pages/Atividades.tsx` → `context="atividade"`
- `src/components/atividades/ConcluirAtividadeDialog.tsx` → `context="atividade"`
- `src/components/atividades/AtividadeDetalheDialog.tsx` → `context="atividade"`
- `src/components/atividades/AtividadeKanbanCard.tsx` → `context="atividade"`
- `src/components/atividades/AtividadeCard.tsx` → `context="atividade"`
- `src/pages/DiarioBordo.tsx` → `context="atividade"`

Negociações não usam o componente ainda, mas a prop fica pronta para uso futuro.

## Detalhes técnicos

No `TemperaturaSelector.tsx`:
- Importar `Tooltip, TooltipTrigger, TooltipContent, TooltipProvider` de `@/components/ui/tooltip` e `Info` de `lucide-react`
- Definir o mapa de textos:
```tsx
const CONTEXT_LABELS = {
  atividade: 'Proximidade com o parceiro',
  negociacao: 'Proximidade com a próxima etapa',
};
```
- No `displayMode`, adicionar uma linha de texto descritivo (`text-[10px] text-muted-foreground`) dentro do `PopoverContent`, acima dos botões de seleção
- No modo inline, envolver o `div` com um wrapper que inclui um icone `Info` com `Tooltip`
