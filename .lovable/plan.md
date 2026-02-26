
# Adicionar Filtro de Temperatura nas abas Propostas e Atividades

## Contexto

Na pagina de Negociacoes (/negociacoes), adicionar filtro por temperatura em ambas as abas:
- **Propostas**: temperatura vem do `cliente.temperatura` (relacao)
- **Atividades**: temperatura vem do campo `temperatura_cliente` da atividade

## 1. Filtro de Temperatura na aba Propostas

### `src/pages/negociacoes/NegociacoesToolbar.tsx`
- Adicionar `temperatura?: ClienteTemperatura` ao `NegociacoesFilters`
- Adicionar um novo Select com opcoes: Todas Temperaturas, Frio, Morno, Quente

### `src/types/negociacoes.types.ts`
- Adicionar `temperatura?: ClienteTemperatura` ao `NegociacaoFilters`

### `src/hooks/useNegociacoes.ts`
- Nas funcoes `useNegociacoesKanban` e `useNegociacoesPaginated`, aplicar filtro `eq('cliente.temperatura', filters.temperatura)` quando presente

### `src/pages/Negociacoes.tsx`
- Passar `filters.temperatura` no `kanbanFilters`

## 2. Filtro de Temperatura na aba Atividades

### `src/pages/Negociacoes.tsx` (componente `AtividadesMetricsAndBoard`)
- Adicionar estado local `temperaturaFilter`
- Renderizar o mesmo seletor de temperatura (TemperaturaSelector ou Select) acima do board
- Passar o filtro para `AtividadeKanbanBoard`

### `src/components/atividades/AtividadeKanbanBoard.tsx`
- Adicionar prop `temperaturaFilter?: ClienteTemperatura`
- Passar no filtro do `useAtividades`

### `src/types/atividades.types.ts`
- Adicionar `temperatura_cliente?: ClienteTemperatura` ao `AtividadeFilters`

### `src/hooks/useAtividades.ts`
- Na funcao `applyAtividadesFilters`, adicionar: `if (filters?.temperatura_cliente) q = q.eq('temperatura_cliente', filters.temperatura_cliente)`

## Resumo de arquivos

| Arquivo | Acao |
|---|---|
| `NegociacoesToolbar.tsx` | Adicionar Select de temperatura |
| `negociacoes.types.ts` | Adicionar campo temperatura ao NegociacaoFilters |
| `useNegociacoes.ts` | Aplicar filtro de temperatura nas queries |
| `Negociacoes.tsx` | Passar temperatura nos filtros kanban + adicionar filtro na aba atividades |
| `AtividadeKanbanBoard.tsx` | Aceitar prop de temperatura e filtrar |
| `atividades.types.ts` | Adicionar temperatura_cliente ao AtividadeFilters |
| `useAtividades.ts` | Aplicar filtro temperatura_cliente |

O filtro visual sera um Select igual aos demais filtros existentes, com opcoes: Frio, Morno, Quente.
