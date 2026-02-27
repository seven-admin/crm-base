
# Adicionar aba Kanban + Melhorias UX na pagina Atividades

## Problemas identificados

1. A pagina `/atividades` nao tem aba Kanban -- so tem Lista, Calendario e Pendencias
2. O `AtividadeKanbanBoard` hardcoda `TIPOS_NEGOCIACAO` -- nao aceita outros tipos
3. Contadores (Atividades Hoje, Este Mes, Resumo por Status) poluem a interface
4. Filtro de data usa `Input type="date"` em vez de seletor de mes
5. Nao ha filtro por temperatura na lista

## Alteracoes

### 1. Tornar `AtividadeKanbanBoard` flexivel (`AtividadeKanbanBoard.tsx`)
- Adicionar prop `tipos?: AtividadeTipo[]` com default `TIPOS_NEGOCIACAO`
- Usar essa prop no filtro em vez do hardcoded `TIPOS_NEGOCIACAO`
- Isso permite reusar o componente tanto no Diario de Bordo (negociacoes) quanto em Atividades (todos os tipos)

### 2. Adicionar aba Kanban na pagina Atividades (`Atividades.tsx`)

**Tabs**: Alterar o state `view` para incluir `'kanban'` e adicionar a aba:
```
Lista | Kanban | Calendario | Pendencias
```

**Conteudo da aba Kanban**:
- Filtro de temperatura (TemperaturaSelector) alinhado a direita
- `AtividadeKanbanBoard` sem filtro de tipos (mostra todas as atividades), usando colunas por status (Pendente / Concluida / Cancelada)

### 3. Remover contadores

- Remover os 2 cards "Atividades Hoje" e "Este Mes" (linhas 347-368)
- Remover o card "Resumo por status" com badges (linhas 484-502)
- Remover hooks nao mais necessarios: `useAtividadesHoje`, `useAgendaMensal`, `useAtividadesStatusResumo` e variaveis derivadas

### 4. Melhorar filtro de data

- Substituir `<Input type="date">` por `<Select>` de mes/ano
- Gerar opcoes dos ultimos 12 meses (ex: "Fevereiro 2026", "Janeiro 2026", ...)
- Ao selecionar um mes, preencher `data_inicio` e `data_fim` nos filtros com primeiro e ultimo dia do mes
- Opcao "Todos" para limpar filtro de data

### 5. Adicionar filtro por temperatura

- Adicionar `TemperaturaSelector` na barra de filtros da lista
- Conectar ao `filters.temperatura_cliente`

### 6. Limpar layout dos filtros

- Remover Card wrapper (header "Filtros") e usar barra compacta inline com os selects

## Arquivos a alterar

| Arquivo | Acao |
|---|---|
| `src/components/atividades/AtividadeKanbanBoard.tsx` | Adicionar prop `tipos` opcional |
| `src/pages/Atividades.tsx` | Adicionar aba Kanban, remover contadores, melhorar filtro de data, adicionar filtro temperatura, limpar layout filtros |
