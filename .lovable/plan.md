
# Filtro por Mes em Negociacoes/Atividades + Limpeza de Filtros em /atividades

## Resumo

Duas alteracoes:
1. Adicionar navegacao por mes (igual ao Diario de Bordo) na aba "Atividades" dentro de `/negociacoes`
2. Em `/atividades`, remover os filtros "Cliente" e "Criado por"

---

## 1. Navegador de mes em /negociacoes > Atividades

### Arquivo: `src/pages/Negociacoes.tsx` (componente `AtividadesMetricsAndBoard`)

- Adicionar estado `competencia` com `useState(new Date())`
- Calcular `dataInicio` e `dataFim` do mes via `startOfMonth`/`endOfMonth`
- Formatar as datas como `yyyy-MM-dd` e passar como filtro `data_inicio`/`data_fim` no `useAtividades`
- Renderizar o navegador de mes (botoes ChevronLeft/ChevronRight + label do mes) acima das metricas, igual ao padrao do DiarioBordo
- Adicionar botao "Este mes" para voltar ao mes corrente

### Arquivo: `src/components/atividades/AtividadeKanbanBoard.tsx`

- Receber props opcionais `dataInicio` e `dataFim` (strings no formato `yyyy-MM-dd`)
- Repassar como filtros `data_inicio` e `data_fim` no `useAtividades`, mesclando com `TIPOS_NEGOCIACAO`

---

## 2. Remover filtros em /atividades

### Arquivo: `src/pages/Atividades.tsx`

- Remover o bloco do Select "Cliente" (linhas 464-474)
- Remover o bloco do Select "Criado por" (linhas 440-450)
- Remover o import de `useClientes` (ja nao sera necessario)
- Ajustar o grid de filtros de `lg:grid-cols-8` para `lg:grid-cols-6` (2 filtros a menos)

---

## Detalhes tecnicos

```text
AtividadesMetricsAndBoard (Negociacoes.tsx)
  |-- competencia (state: Date)
  |-- startOfMonth / endOfMonth -> formato yyyy-MM-dd
  |-- passa para AtividadeKanbanBoard via props
  |-- passa para useAtividades (metricas) via filters

AtividadeKanbanBoard.tsx
  |-- props: { dataInicio?, dataFim? }
  |-- useAtividades({ filters: { tipos: TIPOS_NEGOCIACAO, data_inicio, data_fim } })
```

Nenhuma alteracao de banco de dados necessaria.
