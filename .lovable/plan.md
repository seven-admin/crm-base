
## Diagnóstico definitivo — o problema real

### Por que ainda mostra todos os empreendimentos

O `PlanejamentoGlobal.tsx` tem um state `filters` compartilhado entre TODAS as abas (Resumo, Timeline, Calendário, Equipe). O Calendário tem um Select interno que chama `onFiltersChange` para atualizar esse state — MAS:

1. O `filters` começa como `{}` (vazio), sem `empreendimento_id`
2. Ao carregar a aba Calendário, o hook `usePlanejamentoGlobal({})` dispara uma query SEM filtro de empreendimento — buscando TODOS os dados
3. O React Query cacheia o resultado sem filtro com a chave `['planejamento-global', {}]`
4. Quando o usuário seleciona um empreendimento no Select, o `filters` é atualizado e o cache é invalidado corretamente — MAS se o usuário mudou de aba e voltou, o `filters` global pode ter sido alterado por outra aba

### A solução correta

O `PlanejamentoCalendario` deve ter seu **próprio state local** de `empreendimento_id`, completamente independente do `filters` global. Assim:

- O filtro de empreendimento do Calendário não interfere nas outras abas (Resumo, Timeline, Equipe)
- A query é sempre chamada com o filtro correto
- Quando o usuário entra na aba Calendário sem ter selecionado nada, o state local começa vazio e a busca retorna todos os dados (comportamento esperado para "Todos os empreendimentos")
- Quando seleciona um empreendimento, a busca é filtrada corretamente

### Mudança exata — `src/components/planejamento/PlanejamentoCalendario.tsx`

Trocar de:
```typescript
export function PlanejamentoCalendario({ filters, onFiltersChange }: Props) {
  const { itens, isLoading } = usePlanejamentoGlobal(filters);
  // ...
  <Select
    value={filters.empreendimento_id || 'all'}
    onValueChange={(v) =>
      onFiltersChange({ ...filters, empreendimento_id: v === 'all' ? undefined : v })
    }
  >
```

Para:
```typescript
export function PlanejamentoCalendario({ filters, onFiltersChange }: Props) {
  const [localEmpreendimentoId, setLocalEmpreendimentoId] = useState<string | undefined>(undefined);
  
  // Usar filtros locais — o empreendimento_id é controlado localmente
  const localFilters = { ...filters, empreendimento_id: localEmpreendimentoId };
  const { itens, isLoading } = usePlanejamentoGlobal(localFilters);
  // ...
  <Select
    value={localEmpreendimentoId || 'all'}
    onValueChange={(v) => setLocalEmpreendimentoId(v === 'all' ? undefined : v)}
  >
```

### Por que isso resolve

- O `usePlanejamentoGlobal` recebe um objeto com `empreendimento_id` definido quando o usuário seleciona um empreendimento → a query SQL inclui `&empreendimento_id=eq.{id}` no filtro
- O `usePlanejamentoGlobal` recebe `empreendimento_id: undefined` quando "Todos" está selecionado → a query retorna todos os dados (comportamento correto para visão global)
- Nenhuma outra aba é afetada pelo Select do Calendário

### Arquivo modificado

- `src/components/planejamento/PlanejamentoCalendario.tsx` — trocar o controle do `empreendimento_id` de externo (via `filters`/`onFiltersChange`) para interno (via `useState` local)
