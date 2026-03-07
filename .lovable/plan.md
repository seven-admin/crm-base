

# Plano: Calendário como Interface Principal de Entrada de Dados

## Problema Atual

O calendário atual (`PlanejamentoCalendarioEmpreendimento`) é **somente leitura** — exibe tarefas mas não permite criar, editar ou gerenciar. Toda entrada de dados depende da aba Planilha. Para tornar o calendário a interface principal, precisamos de uma UX completa de CRUD diretamente nele.

## O que muda

### 1. Calendário como aba padrão (em vez de Planilha)
- Reordenar as tabs: **Calendário → Planilha → Timeline → Dashboard**
- `activeTab` default passa de `'planilha'` para `'calendario'`

### 2. Criar tarefa clicando no dia
- Clicar em um dia vazio (ou no botão "+" que aparece no hover) abre um **popover/dialog inline** para criação rápida
- Campos mínimos: Nome da tarefa, Fase (select), Data início = dia clicado, Data fim (date picker)
- Campos opcionais expansíveis: Status, Responsável, Observações
- Enter para salvar, Escape para cancelar

### 3. Editar tarefa inline no painel lateral
- O painel lateral direito (detalhes do dia) ganha capacidade de edição
- Cada campo (nome, fase, status, datas, responsável) se torna editável ao clicar
- Botões de ação: Duplicar, Excluir, Converter (reaproveitando lógica existente da Planilha)

### 4. Drag & drop para mover datas
- Arrastar uma tarefa de um dia para outro atualiza `data_inicio` e `data_fim` (mantendo a duração)
- Feedback visual durante o drag (ghost element, highlight do dia destino)

### 5. Melhorias visuais no grid
- Hover no dia mostra botão "+" para criar tarefa rápida
- Tarefas clicáveis abrem edição no painel lateral
- Indicador visual de tarefas atrasadas (borda vermelha)
- Célula do dia com altura mínima maior para acomodar interação

## Detalhamento Técnico

### Arquivos modificados

| Arquivo | Alteração |
|---|---|
| `src/pages/Planejamento.tsx` | Tab default = `'calendario'`, reordenar tabs |
| `src/pages/portal-incorporador/PortalIncorporadorPlanejamento.tsx` | Mesma reordenação de tabs |
| `src/components/planejamento/PlanejamentoCalendarioEmpreendimento.tsx` | Reescrita significativa — adicionar criação, edição inline, drag & drop |

### Novos componentes

| Componente | Função |
|---|---|
| `CalendarioCriarTarefaPopover.tsx` | Popover/dialog para criar tarefa ao clicar no dia |
| `CalendarioDiaDetalhe.tsx` | Painel lateral com edição inline das tarefas do dia selecionado |
| `CalendarioDiaCell.tsx` | Célula individual do dia com hover actions e drop target |

### Hooks reutilizados (sem alteração)
- `usePlanejamentoItens` — já tem `createItem`, `updateItem`, `deleteItem`, `duplicateItem`
- `usePlanejamentoFases` — para selects de fase
- `usePlanejamentoStatus` — para selects de status
- `useFuncionariosSeven` — para selects de responsável

### Fluxo de criação rápida

```text
┌──────────────────────────────────────┐
│  Dia 15  [+]                         │  ← hover mostra [+]
│  ▪ Tarefa existente                  │
│  ▪ +1 mais                           │
└──────────────────────────────────────┘
         │ click [+]
         ▼
┌──────────────────────────────────────┐
│  Nova Tarefa                         │
│  ┌────────────────────────────────┐  │
│  │ Nome da tarefa...              │  │
│  └────────────────────────────────┘  │
│  Fase: [▼ Selecione]                 │
│  Fim:  [📅 Selecione]               │
│  ─── Mais campos ───                 │
│  [Cancelar]  [Criar]                 │
└──────────────────────────────────────┘
```

### Painel lateral com edição

O painel lateral atual mostra informações read-only. Será transformado para permitir:
- Click no nome → input editável
- Click no status/fase → select inline
- Click nas datas → date picker
- Botão de ações (3 dots) → Duplicar, Excluir, Converter
- Reutiliza a mesma lógica de `handleSelectChange`, `handleDateChange` e `handleCellClick` da Planilha

### Drag & Drop
- Usar `@hello-pangea/dnd` (já instalado) para arrastar tarefas entre dias
- Ao soltar: calcula diferença de dias e aplica offset em `data_inicio` e `data_fim`
- Opcional na primeira fase — pode ser implementado depois

## Fases de Implementação

1. **Fase 1**: Reordenar tabs + criar tarefa via popover no calendário + edição no painel lateral
2. **Fase 2**: Drag & drop entre dias + melhorias visuais (hover states, indicadores)

## Sem alterações no banco de dados
Toda a lógica de CRUD já existe nos hooks. A mudança é puramente de interface.

