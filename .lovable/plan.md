

# Plano: Click no card do Kanban abre detalhamento da negociação

## Problema
Atualmente, clicar no card do Kanban de negociações (`/negociacoes`) não faz nada. O usuário precisa usar o menu dropdown (3 pontos) para qualquer ação. O esperado é que um clique simples abra um modal com o detalhamento da negociação.

## Solução

### 1. Criar componente `NegociacaoDetalheDialog`
Novo arquivo `src/components/negociacoes/NegociacaoDetalheDialog.tsx` — um Dialog/Sheet que exibe os dados completos da negociação:
- Cliente, Empreendimento, Corretor, Gestor
- Código e número da proposta
- Status da proposta (badge colorido)
- Etapa atual do funil
- Valor da negociação/proposta
- Unidades vinculadas
- Data de criação
- Botões de ação rápida: Editar (navega para `/negociacoes/editar/:id`), Mover etapa, Histórico

### 2. Adicionar `onClick` ao `NegociacaoCard`
- Adicionar prop `onClick?: (negociacao: Negociacao) => void` ao `NegociacaoCardProps`
- No `<Card>`, adicionar `onClick={() => onClick?.(negociacao)}`
- Garantir que o dropdown menu tenha `e.stopPropagation()` para não disparar o onClick do card

### 3. Integrar no `FunilKanbanBoard`
- Adicionar estado `detalheNegociacao` para controlar qual negociação está aberta no dialog
- Passar `onClick={handleOpenDetalhe}` ao `NegociacaoCard` no `renderCard`
- Renderizar `NegociacaoDetalheDialog` no JSX

## Arquivos afetados

| Arquivo | Alteração |
|---|---|
| `NegociacaoDetalheDialog.tsx` | **Novo** — modal de detalhamento |
| `NegociacaoCard.tsx` | Adicionar prop `onClick` e handler no `<Card>` |
| `FunilKanbanBoard.tsx` | Estado + integração do dialog |

