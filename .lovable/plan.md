

# Adicionar filtros completos na aba Kanban de Atividades

## Problema
A aba Kanban em `/atividades` so tem o filtro de temperatura. Precisa ter os mesmos filtros da aba Lista: Tipo, Status, Responsavel, Empreendimento, Mes e Temperatura.

## Solucao

### Arquivo: `src/pages/Atividades.tsx`

Substituir o bloco da view Kanban (linhas 374-390) para incluir a mesma barra de filtros da lista, reutilizando o state `filters` ja existente:

- **Tipo** (Select): conectado a `filters.tipo`
- **Status** (Select): conectado a `filters.status`
- **Responsavel** (Select): conectado a `filters.responsavel_id`
- **Empreendimento** (Select): conectado a `filters.empreendimento_id`
- **Mes** (Select de mes/ano): conectado a `filters.data_inicio` / `filters.data_fim`
- **Temperatura** (TemperaturaSelector): ja existente, manter `kanbanTemperatura`

O `AtividadeKanbanBoard` ja recebe `dataInicio` e `dataFim` dos filters -- basta garantir que os novos filtros (tipo, status, responsavel, empreendimento) tambem sejam passados.

### Arquivo: `src/components/atividades/AtividadeKanbanBoard.tsx`

Adicionar props opcionais para os filtros adicionais: `responsavelId`, `empreendimentoId`, `status`, `tipo` -- e passa-los ao `useAtividades`.

### Layout

```text
[Tipo] [Status] [Responsavel] [Empreendimento] [Mes]  [Temperatura]
+----------+ +----------+ +----------+
| Pendente | | Concluida| | Cancelada|
|  (3)     | |  (5)     | |  (2)     |
+----------+ +----------+ +----------+
```

Os filtros ficam em uma barra compacta `flex-wrap` acima do Kanban, identica ao padrao da lista.

