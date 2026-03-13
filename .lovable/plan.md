

# Unificar Fluxo de Proposta: Redirecionar para NovaPropostaComercial + Adicionar Comentários

## Problema
Quando o usuário clica em "Gerar Proposta" ou arrasta um card para "Análise de Proposta" no Kanban, abre o `PropostaDialog` (modal simplificado). O layout correto e completo é o da página `/negociacoes/editar/:id` (`NovaPropostaComercial`), que já tem cliente, unidades, responsáveis, condições, dação e resumo.

## Alterações

### 1. `src/components/negociacoes/FunilKanbanBoard.tsx`

- **`handleGerarProposta`** (linha 151): Em vez de abrir `PropostaDialog` com mode `gerar`, navegar para `/negociacoes/editar/${negociacao.id}`
- **`handleEditarProposta`** (linha 181): Navegar para `/negociacoes/editar/${negociacao.id}` em vez de abrir o dialog com mode `view`
- **Drag-and-drop para "Análise de Proposta"** (linha 244): Navegar para `/negociacoes/editar/${negociacao.id}` em vez de abrir o dialog
- Manter `PropostaDialog` apenas para `aceitar` e `recusar` (que são ações pontuais com botão de confirmação)

### 2. `src/pages/NovaPropostaComercial.tsx`

- Adicionar `ComentariosTab` na coluna esquerda, abaixo de `DacaoAnexosCard`, visível apenas em modo edição (`editId` existe)
- Importar `ComentariosTab` de `@/components/negociacoes/ComentariosTab`
- Envolver em um `Card` com título "Comentários"

### Resultado
- "Gerar Proposta" e "Editar Proposta" sempre abrem a página completa com todos os recursos (dação, comentários, condições, resumo)
- "Aceitar" e "Recusar" continuam no dialog compacto (apropriado para essas ações)

