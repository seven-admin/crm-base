
# Adicionar Cards de Contadores na Aba Atividades

## Resumo

Adicionar a mesma barra de metricas (4 cards) que existe na aba "Propostas" tambem na aba "Atividades" em `/negociacoes`, com metricas adaptadas ao contexto de atividades.

## Cards planejados

| Card | Conteudo |
|---|---|
| Total de Atividades | Contagem total de atividades carregadas |
| Pendentes | Quantidade com status "pendente" |
| Concluidas | Quantidade com status "concluida" |
| Por Etapa | Badges coloridas com contagem por etapa (mesmo estilo de Propostas) |

## Alteracoes

### Arquivo: `src/pages/Negociacoes.tsx`

- Importar `useAtividades` e `useAtividadeEtapas` para obter os dados de atividades na pagina
- Calcular metricas: total, pendentes, concluidas, contagem por etapa
- Adicionar grid de 4 Cards acima do `AtividadeKanbanBoard` dentro do `TabsContent value="atividades"`
- Usar exatamente o mesmo layout visual dos cards de Propostas (grid 2x4, mesmas classes)

### Arquivo: `src/components/atividades/AtividadeKanbanBoard.tsx`

- Nenhuma alteracao necessaria. Os dados serao buscados diretamente na pagina pai.

## Detalhes tecnicos

Os dados vem do mesmo hook `useAtividades` com filtro `TIPOS_NEGOCIACAO` que o Kanban ja usa. Para evitar duplicar a chamada, a pagina fara a query e passara os dados por props, ou fara uma query separada (mais simples, o React Query deduplica automaticamente).

```text
const { data: atividadesData } = useAtividades({
  filters: { tipos: TIPOS_NEGOCIACAO },
  page: 1, pageSize: 200,
});
const atividades = atividadesData?.items || [];
const totalAtividades = atividades.length;
const pendentes = atividades.filter(a => a.status === 'pendente').length;
const concluidas = atividades.filter(a => a.status === 'concluida').length;
// countPerEtapa similar ao countPerStage de propostas
```
