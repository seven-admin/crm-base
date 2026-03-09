

# Adicionar botão de Destaque nas views de Calendário e Lista

## Situação atual
O botão de destaque (estrela) existe **apenas** dentro do `TarefaDetalheDialog`, que só é usado na aba Timeline. As abas **Calendário** e **Lista** (as mais usadas) não têm acesso a essa funcionalidade.

## Alterações

### 1. `CalendarioDiaDetalhe.tsx` — Adicionar "Destaque" no menu de ações
- No dropdown de cada card (linhas 166-184), adicionar um `DropdownMenuItem` para alternar destaque
- Usar `onUpdate(item.id, { destaque: !item.destaque })` 
- Ícone: `Star` (preenchida se `item.destaque` for true)
- Texto: "Marcar destaque" / "Remover destaque"
- Adicionar indicador visual de estrela no card quando `item.destaque === true`

### 2. `PlanejamentoListaGlobal.tsx` — Adicionar "Destaque" no menu de ações
- No dropdown de cada linha (linhas 528-542), adicionar um `DropdownMenuItem` para alternar destaque
- Mesma lógica: `Star` icon + toggle via `updateItem.mutate`
- Adicionar ícone de estrela na célula do nome da tarefa quando `item.destaque === true`

### 3. `PlanejamentoCalendario.tsx` — Indicador visual nas barras do calendário
- Nas barras multi-day e single-day events, mostrar ícone de estrela quando `item.destaque === true` (similar ao que já existe no Timeline)

### Arquivos afetados
- `src/components/planejamento/CalendarioDiaDetalhe.tsx`
- `src/components/planejamento/PlanejamentoListaGlobal.tsx`
- `src/components/planejamento/PlanejamentoCalendario.tsx`

