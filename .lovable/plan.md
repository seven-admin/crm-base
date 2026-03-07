

# Plano: Aba Lista + Converter em Atividade + Barras multi-dia no Calendário

## 1. Nova aba "Lista" no Planejamento

Criar `PlanejamentoListaGlobal.tsx` baseado na estrutura do `PlanejamentoPlanilha.tsx` existente, mas usando `usePlanejamentoGlobal` para dados globais.

- Filtro de empreendimento no topo (select "Todos" ou específico)
- Quando "Todos": agrupa por empreendimento; quando específico: agrupa por fase
- CRUD completo: criar, editar inline, duplicar, excluir, excluir em lote
- Menu de ações inclui "Converter em Atividade" usando `ConverterTarefaDialog` existente
- Adicionar aba "Lista" em `Planejamento.tsx`

**Arquivos:** `src/components/planejamento/PlanejamentoListaGlobal.tsx` (novo), `src/pages/Planejamento.tsx`

## 2. Converter tarefa em Atividade no calendário

Adicionar opção "Converter em Atividade" no dropdown de ações de cada card no `CalendarioDiaDetalhe.tsx`, reutilizando `ConverterTarefaDialog.tsx`.

**Arquivo:** `src/components/planejamento/CalendarioDiaDetalhe.tsx`

## 3. Barras multi-dia no calendário (span visual)

Atualmente cada tarefa aparece como chip individual repetido em cada dia. Para tarefas com `data_inicio` e `data_fim` diferentes, renderizar uma **barra contínua** que se estende visualmente pelos dias cobertos.

### Abordagem técnica

Renderizar as barras multi-dia como uma **camada separada sobre o grid**, usando `position: absolute` com cálculos de posição baseados na coluna (dia da semana) e linha (semana do mês).

Para cada tarefa multi-dia:
1. Calcular dias de início e fim dentro do mês visível (clamp nas bordas do mês)
2. Dividir em **segmentos por semana** (uma barra não pode cruzar linhas do grid)
3. Cada segmento renderiza como div absoluto posicionado:
   - `left`: coluna do dia início do segmento × largura da célula
   - `width`: (coluna fim - coluna início + 1) × largura da célula
   - `top`: linha da semana × altura da célula + offset vertical
4. Primeiro segmento tem borda arredondada à esquerda, último à direita
5. Cor baseada no empreendimento (mesmo esquema de cores atual)
6. Texto do item aparece truncado no primeiro segmento

Tarefas de dia único continuam como chips normais dentro da célula (comportamento atual).

O grid precisa de `position: relative` no container e as barras ficam em um layer separado com `pointer-events: none` (exceto hover para tooltip).

**Arquivo:** `src/components/planejamento/PlanejamentoCalendario.tsx` (refatorar grid + adicionar layer de barras multi-dia)

## 4. Indicador de total de tarefas

Quando o mês atual não tem tarefas visíveis mas existem tarefas em outros meses, exibir texto informativo no header: "X tarefas no total".

**Arquivo:** `src/components/planejamento/PlanejamentoCalendario.tsx`

## Resumo de arquivos

| Arquivo | Ação |
|---|---|
| `src/components/planejamento/PlanejamentoListaGlobal.tsx` | Novo — lista/tabela global com CRUD + agrupamento |
| `src/pages/Planejamento.tsx` | Adicionar aba "Lista" |
| `src/components/planejamento/CalendarioDiaDetalhe.tsx` | Adicionar "Converter em Atividade" no dropdown |
| `src/components/planejamento/PlanejamentoCalendario.tsx` | Barras multi-dia + indicador de total |

