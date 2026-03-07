

# Plano: 3 ajustes no Planejamento

## 1. Remover alertas do Resumo
Remover a seção de alertas (linhas 142-160) do `PlanejamentoGlobalResumo.tsx` -- os cards de "Alerta Crítico" e "Atenção" que poluem a tela.

**Arquivo:** `src/components/planejamento/PlanejamentoGlobalResumo.tsx`

## 2. Calendário não exibe todas as tarefas (modo "Todos")
O Supabase tem limite padrão de 1000 linhas por query. Quando não há filtro de empreendimento, a query pode ser truncada silenciosamente. Solução: adicionar `.limit(5000)` na query do `usePlanejamentoGlobal.ts` e remover o filtro que exige `data_inicio` E `data_fim` simultaneamente (tarefas com apenas uma data também devem aparecer no calendário).

**Arquivo:** `src/hooks/usePlanejamentoGlobal.ts`, `src/components/planejamento/PlanejamentoCalendario.tsx`

## 3. Painel lateral: agrupar tarefas por empreendimento
No `CalendarioDiaDetalhe.tsx`, em vez de listar todas as tarefas flat, agrupar por `item.empreendimento.nome` com headers visuais (nome do empreendimento + cor) separando os grupos.

**Arquivo:** `src/components/planejamento/CalendarioDiaDetalhe.tsx`

