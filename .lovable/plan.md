
## Causa raiz confirmada

O `PlanejamentoCalendario` (aba Calendário na Visão Global) usa `usePlanejamentoGlobal(filters)`. O tipo `PlanejamentoGlobalFilters` é:

```typescript
export interface PlanejamentoGlobalFilters {
  data_de?: string;
  data_ate?: string;
  responsavel_id?: string;
  fase_id?: string;
  status_id?: string;
  // empreendimento_id NÃO EXISTE
}
```

E `usePlanejamentoGlobal` nunca aplica filtro por empreendimento na query SQL. Resultado: o calendário mostra tarefas de TODOS os empreendimentos, independente do que o usuário selecionar.

## Solução — 3 arquivos alterados

### 1. `src/hooks/usePlanejamentoGlobal.ts`

Adicionar `empreendimento_id?: string` ao `PlanejamentoGlobalFilters` e aplicar o filtro na query:

```typescript
export interface PlanejamentoGlobalFilters {
  data_de?: string;
  data_ate?: string;
  responsavel_id?: string;
  fase_id?: string;
  status_id?: string;
  empreendimento_id?: string;  // NOVO
}
```

E na query dentro de `usePlanejamentoGlobal`:

```typescript
if (filters?.empreendimento_id) {
  query = query.eq('empreendimento_id', filters.empreendimento_id);
}
```

### 2. `src/components/planejamento/PlanejamentoCalendario.tsx`

Adicionar um seletor de empreendimento no topo do componente. Quando o usuário selecionar um empreendimento, chamar `onFiltersChange({ ...filters, empreendimento_id: id })`. Quando limpar, remover o campo.

- Usar `useEmpreendimentosSelect` para listar os empreendimentos disponíveis
- Adicionar um `Select` com opção "Todos os empreendimentos" (limpa o filtro) e lista dos empreendimentos
- O seletor fica no `CardHeader` do calendário
- Quando filtrado por um único empreendimento, a legenda de cores mostra só esse

### 3. `src/components/planejamento/PlanejamentoGlobalTimeline.tsx`

Também adicionar um seletor de empreendimento nos filtros da Timeline Global, pois a mesma interface `PlanejamentoGlobalFilters` é compartilhada. Com o campo `empreendimento_id` agora disponível no tipo, a Timeline também vai filtrar corretamente via `usePlanejamentoGlobal`.

## Comportamento após a correção

- Visão Global → aba Calendário: aparece seletor "Todos os empreendimentos" no topo. Ao selecionar um, só as tarefas desse empreendimento aparecem no calendário e no painel lateral.
- Visão Global → aba Timeline Global: idem, o seletor de empreendimento (já existente ou a ser adicionado) passa o `empreendimento_id` pelo `onFiltersChange`, e o hook aplica o filtro no banco.
- Visão "Por Empreendimento": não é afetada — usa `usePlanejamentoItens` com `empreendimento_id` diretamente, que já funciona corretamente.

## Resumo das mudanças técnicas

| Arquivo | Mudança |
|---|---|
| `usePlanejamentoGlobal.ts` | Adicionar `empreendimento_id` ao tipo e aplicar filtro na query |
| `PlanejamentoCalendario.tsx` | Adicionar Select de empreendimento que chama `onFiltersChange` |
| `PlanejamentoGlobalTimeline.tsx` | Expor o filtro de empreendimento via `onFiltersChange` quando o usuário interagir |
