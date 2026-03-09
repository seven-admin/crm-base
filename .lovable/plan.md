

# Destaque em Tarefas do Planejamento

O campo `destaque` foi adicionado apenas na tabela `atividades`. Para o módulo de **Planejamento** (`planejamento_itens`), o campo não existe ainda. Precisamos replicar a funcionalidade.

## Alterações

### 1. Banco de Dados
- Adicionar coluna `destaque boolean default false` na tabela `planejamento_itens`

### 2. Tipos (`src/types/planejamento.types.ts`)
- Adicionar `destaque?: boolean` em `PlanejamentoItem`, `PlanejamentoItemCreate` e `PlanejamentoItemUpdate`

### 3. Detalhe da Tarefa (`TarefaDetalheDialog.tsx`)
- Adicionar botão/toggle de destaque (estrela) no header, junto aos badges
- Usar `usePlanejamentoItens` para chamar a mutation de update com `{ destaque: !item.destaque }`

### 4. Visual na Timeline e Lista
- No `PlanejamentoTimeline.tsx` — adicionar ícone de estrela nas barras de itens com destaque
- Nos componentes de lista (se houver cards) — borda amber + estrela, mesmo padrão das atividades

### 5. Formulário de criação/edição
- Adicionar toggle de destaque no formulário inline ou popover de criação de tarefas do planejamento

### Arquivos afetados
- Nova migration SQL
- `src/types/planejamento.types.ts`
- `src/components/planejamento/TarefaDetalheDialog.tsx`
- `src/components/planejamento/PlanejamentoTimeline.tsx`
- Componentes de formulário/lista do planejamento (se aplicável)

