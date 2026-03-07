

# Fases por Empreendimento no Editor de Configurações

## Situação atual
O `PlanejamentoFasesEditor` não recebe nem permite selecionar um empreendimento. Todas as fases são criadas como globais (`empreendimento_id = null`). O hook `usePlanejamentoFases` já suporta filtro por `empreendimentoId`, e a tabela `planejamento_fases` já tem a coluna `empreendimento_id`.

## Plano

### 1. Adicionar seletor de empreendimento ao `PlanejamentoFasesEditor`
- Adicionar um `Select` no topo do card com as opções: **"Global (todos)"** + lista de empreendimentos (via `useEmpreendimentosSelect`)
- Quando "Global" selecionado: mostra fases com `empreendimento_id = null`
- Quando um empreendimento selecionado: mostra fases globais + fases daquele empreendimento (comportamento atual do hook)
- Ao criar nova fase: se um empreendimento está selecionado, salvar com `empreendimento_id`; se "Global", salvar com `null`

### 2. Indicação visual de escopo
- Fases globais: badge "Global" discreto ao lado do nome
- Fases de empreendimento: badge com nome do empreendimento
- Quando visualizando um empreendimento específico, as fases globais ficam com visual mais sutil (são herdadas, não editáveis nesse contexto) e as do empreendimento ficam editáveis normalmente

### 3. Regra de edição/exclusão
- Fases globais só podem ser editadas/excluídas quando o filtro está em "Global"
- Fases de empreendimento só podem ser editadas no contexto do empreendimento correspondente

### Arquivos afetados
- `src/components/planejamento/PlanejamentoFasesEditor.tsx` — adicionar select de empreendimento, passar `empreendimentoId` ao hook, badges de escopo, lógica de permissão de edição
- `src/hooks/usePlanejamentoFases.ts` — ajustar query para filtrar apenas globais quando `empreendimentoId` não informado

