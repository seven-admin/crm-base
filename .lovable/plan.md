

# Padronizar todos os calendários no estilo do Planejamento Global

## Referência (PlanejamentoCalendario.tsx — o modelo)
- `gap-0` entre células (sem espaçamento)
- Bordas retas via `border-r border-b` (sem `rounded-lg`)
- Header dos dias da semana com `border-b` e `border-r last:border-r-0`
- Células com `min-h-[100px]`, sem arredondamento
- Hover com `bg-accent/50`, seleção com `bg-accent`
- `px-0 pb-0` no CardContent para as bordas colarem nas laterais

## Calendários a padronizar (5 componentes)

### 1. `src/components/eventos/EventosCalendario.tsx`
- Remover `gap-1` do header e grid → sem gap
- Adicionar `border-b` no header, `border-r last:border-r-0` em cada label
- Células: trocar `rounded-lg border` por `border-r border-b`, remover arredondamento
- Trocar `h-24` por `min-h-[100px]`
- CardContent: `px-0 pb-0`
- Células vazias: adicionar `border-r border-b bg-muted/20`

### 2. `src/components/agenda/AgendaCalendario.tsx`
- Remover `gap-1` do header e grid
- Adicionar bordas retas no header
- Células: trocar `rounded-lg aspect-square` por `min-h-[100px] border-r border-b` sem arredondamento
- Manter indicadores de atividades mas adaptar layout para célula retangular (dia no topo-esquerda, indicadores abaixo)

### 3. `src/components/forecast/CalendarioCompacto.tsx`
- Remover `gap-1` do header e grid
- Adicionar bordas retas
- Células: trocar `aspect-square rounded-md` por `min-h-[80px] border-r border-b` (menor pois é compacto)
- Adaptar layout dos indicadores
- CardContent: `px-0 pb-0`

### 4. `src/components/marketing/TicketsCalendario.tsx`
- Remover `gap-1` do grid
- Células: trocar `rounded-lg border` por `border-r border-b`
- Trocar `h-24` por `min-h-[100px]`
- CardContent: `px-0 pb-0`
- Células vazias: `border-r border-b bg-muted/20`

### 5. `src/components/planejamento/PlanejamentoCalendarioEmpreendimento.tsx`
- Remover `gap-1` do header e grid
- Adicionar bordas retas no header (`border-b`, `border-r last:border-r-0`)
- CardContent: `px-0 pb-0` (adicionar `className` override)
- Células vazias: `border-r border-b bg-muted/20` em vez de simples `h-28`

### 6. `src/components/planejamento/CalendarioDiaCell.tsx` (usado pelo empreendimento)
- Trocar `rounded-lg border` por `border-r border-b` (bordas retas, sem arredondamento)
- Trocar `h-32` por `min-h-[100px]`
- Remover `ring-2 ring-primary/20` da seleção → usar apenas `bg-accent`

## Padrão CSS unificado

```text
Header:    grid grid-cols-7 border-b
           cada label: text-center text-xs font-medium text-muted-foreground py-2 border-r last:border-r-0

Grid:      grid grid-cols-7  (sem gap)

Célula:    min-h-[100px] border-r border-b transition-colors relative group cursor-pointer flex flex-col
           hover:bg-accent/50
           selected: bg-accent
           last-col: border-r-0 (opcional)

Vazia:     min-h-[100px] border-r border-b bg-muted/20

CardContent: px-0 pb-0
```

