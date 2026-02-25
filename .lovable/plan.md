
# Forecast como Dashboard Puro

## Resumo

Remover todas as acoes (botoes de nova atividade, acoes em lote, link "Ver Atividades") do Forecast, mantendo apenas os filtros de competencia/gestor e os dados do dashboard. As acoes ja existem na pagina de Atividades (Diario de Bordo).

---

## Alteracoes

### Arquivo: `src/pages/Forecast.tsx`

**Remover do header:**
- Botao "Ver Atividades" (link para /atividades)
- Botao "Acoes em Lote" (super_admin)
- Botao "Nova Atividade"

**Remover states e logica associada:**
- `dialogOpen`, `modoLote`, `batchDialog`
- `createAtividade`, `createAtividadesParaGestores`
- `handleSubmit`
- Logica `onBadgeClick` dos CategoriaCards (passa `undefined` sempre)

**Remover dialogs:**
- Dialog de Nova Atividade (AtividadeForm)
- ForecastBatchStatusDialog

**Remover imports nao utilizados:**
- `Plus`, `ListChecks`, `ClipboardList`, `Link`
- `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`
- `ForecastBatchStatusDialog`, `AtividadeForm`
- `useCreateAtividade`, `useCreateAtividadesParaGestores`
- `useAuth`
- `AtividadeFormSubmitData`

**Manter:**
- Filtros de competencia (seletor de mes, "Este mes", "Mes anterior")
- Filtro de gestor (Select)
- Tabs Negociacoes / Atividades com KPIs e cards de categoria
- Todos os hooks de dados (resumo, financeiro)

### Nenhuma alteracao na pagina de Atividades
A pagina `/atividades` ja possui o botao "Nova Atividade", acoes em lote (concluir/reabrir), e toda a gestao necessaria.
