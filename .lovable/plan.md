
# Reestruturacao do Fluxo Comercial e Diario de Bordo

## Resumo

Reorganizar o sidebar, unificar o cadastro de atividades no Diario de Bordo, adicionar atividades ao Kanban de Propostas (em abas), e criar botao de conversao de atividade em proposta.

---

## 1. Sidebar - Nova Estrutura

### Comercial (cor laranja, icone Target)
| Item | Path | Icone |
|---|---|---|
| Forecast | /forecast | TrendingUp |
| Negociacoes | /atividades?contexto=forecast | ClipboardList |
| Propostas | /negociacoes | Kanban |
| Solicitacao de Reserva | /solicitacoes | ClipboardCheck |
| Metas | /metas-comerciais | Target |

### Diario de Bordo (cor ciano, icone BookOpen)
| Item | Path | Icone |
|---|---|---|
| Atividades | /atividades | ClipboardList |

**Arquivo:** `src/components/layout/Sidebar.tsx`
- Renomear "Atividades" para "Negociacoes" no grupo Comercial
- Renomear "Fichas de Proposta" para "Propostas"
- Renomear "Solicitacoes" para "Solicitacao de Reserva"
- Renomear "Metas Comerciais" para "Metas"
- No Diario de Bordo: remover o Dashboard, manter apenas "Atividades" com path `/atividades` (sem parametro de contexto)

---

## 2. Diario de Bordo - Listagem Unificada de Atividades

**Arquivo:** `src/pages/Atividades.tsx`
- Quando acessado sem parametro `contexto` (via Diario de Bordo), exibir TODOS os tipos de atividades
- Titulo: "Atividades" / "Gerencie as atividades comerciais e operacionais"

---

## 3. Modal de Criacao Reestruturado

**Arquivo:** `src/components/atividades/AtividadeForm.tsx`

### Nova Step 1 - Dois botoes de selecao iniciais

Antes de exibir os tipos, mostrar dois botoes grandes de selecao:

- **Negociacao** - Ao clicar, exibe apenas os tipos: `atendimento`, `assinatura`
- **Atividades** - Ao clicar, exibe apenas os tipos: `atendimento`, `assinatura` (tipos de negociacao que tambem sao atividades)

Correcao: com base nas respostas:
- **Negociacao**: tipos `atendimento`, `assinatura`
- **Atividades**: tipos `atendimento`, `assinatura`

Isso seria redundante. Interpretacao corrigida:
- **Negociacao**: tipos comerciais = `atendimento`, `assinatura`  
- **Atividades**: tipos operacionais = `ligacao`, `meeting`, `reuniao`, `visita`, `acompanhamento`, `treinamento`, `administrativa`

### Mudancas tecnicas
- Adicionar um state `modo: 'negociacao' | 'atividade'` antes do step 1
- Quando `tiposPermitidos` e passado como prop (ex: do Forecast), manter comportamento atual
- Quando o form e aberto sem `tiposPermitidos` (Diario de Bordo unificado), mostrar a selecao de modo primeiro
- Modo "Negociacao" filtra para `['atendimento', 'assinatura']`
- Modo "Atividades" filtra para `['ligacao', 'meeting', 'reuniao', 'visita', 'acompanhamento', 'treinamento', 'administrativa']`

### Estilizacao
- Dois botoes lado a lado com icones grandes
- Negociacao: icone Handshake, cor primaria
- Atividades: icone ClipboardList, cor cyan
- Cards com borda destacada ao selecionar

---

## 4. Kanban de Propostas com Aba de Atividades

**Arquivo:** `src/pages/Negociacoes.tsx`

Adicionar Tabs no topo do Kanban:
- **Propostas** (atual): Kanban de negociacoes com etapas do funil
- **Atividades**: Kanban de atividades comerciais (tipos `atendimento`, `assinatura`)

### Aba Atividades - Kanban
- Colunas baseadas em status: `Pendente`, `Concluida`, `Cancelada`
- Cards de atividade mostrando: titulo, tipo, cliente, data, temperatura
- Drag-and-drop para mover entre status

**Novos arquivos:**
- `src/components/atividades/AtividadeKanbanBoard.tsx` - Kanban de atividades por status
- `src/components/atividades/AtividadeKanbanCard.tsx` - Card de atividade no Kanban

**Hooks necessarios:**
- Reutilizar `useAtividades` com filtro para tipos comerciais

---

## 5. Botao Converter Atividade em Proposta

### Na listagem de atividades e no Kanban de atividades

Adicionar botao/menu "Converter em Proposta" em cada atividade comercial (tipo `atendimento` ou `assinatura`).

Ao clicar:
1. Redirecionar para `/negociacoes/nova` com query params pre-preenchidos
2. Query params: `?cliente_id={id}&empreendimento_id={id}&corretor_id={id}&atividade_origem_id={id}`

**Arquivos afetados:**
- `src/pages/Atividades.tsx` - Adicionar botao na tabela de acoes
- `src/components/atividades/AtividadeKanbanCard.tsx` - Adicionar opcao no menu do card
- `src/pages/NovaPropostaComercial.tsx` - Ler query params e pre-preencher campos

---

## Detalhes Tecnicos

### Arquivos a modificar
1. `src/components/layout/Sidebar.tsx` - Renomear itens e reorganizar menus
2. `src/components/atividades/AtividadeForm.tsx` - Adicionar selecao de modo (Negociacao/Atividades)
3. `src/pages/Atividades.tsx` - Titulo dinamico, botao converter em proposta
4. `src/pages/Negociacoes.tsx` - Adicionar abas Propostas/Atividades com Kanban de atividades
5. `src/pages/NovaPropostaComercial.tsx` - Ler query params para pre-preenchimento

### Novos arquivos
1. `src/components/atividades/AtividadeKanbanBoard.tsx`
2. `src/components/atividades/AtividadeKanbanCard.tsx`

### Tipos a atualizar
- `src/types/atividades.types.ts` - Criar constante `TIPOS_NEGOCIACAO = ['atendimento', 'assinatura']`

### Nenhuma alteracao de banco de dados necessaria
Todo o fluxo utiliza a tabela `atividades` existente e as queries ja implementadas.
