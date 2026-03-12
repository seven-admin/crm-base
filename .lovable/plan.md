

# Correções: Flickering do Kanban + Visibilidade do Portal Incorporador

## 1. Flickering ao mover cards no Kanban

### Causa raiz
O `useEffect` nas linhas 93-97 do `FunilKanbanBoard.tsx` limpa o estado otimista (`setOptimisticNegociacoes(null)`) assim que `negociacoes` muda E `moverMutation.isPending` é `false`. O problema é que o react-query pode refazer a query (com dados antigos ainda no servidor) **antes** da mutation completar, gerando a sequência:

1. Card arrastado → atualização otimista (card na posição nova)
2. React-query refetch automático retorna dados antigos → useEffect limpa otimista → card volta à posição antiga
3. Mutation completa → `onSuccess` invalida queries → dados novos chegam → card vai para posição nova de novo
4. Toast "movido com sucesso" aparece

### Solução
- Remover o `useEffect` que limpa otimisticamente baseado em `negociacoes`
- Manter apenas o `onSettled` callback da mutation para limpar o estado otimista (já existe na linha 282-286)
- Isso garante que o estado otimista persiste até a mutation de fato terminar

### Arquivo: `src/components/negociacoes/FunilKanbanBoard.tsx`
Remover linhas 92-97 (o useEffect problemático).

---

## 2. Portal do Incorporador - Visibilidade de negociações

### Situação atual
Em `PortalIncorporadorPropostas.tsx` (linhas 114-118), o incorporador só vê negociações com `status_proposta === 'em_analise'` ou na etapa de Análise de Proposta. Não há seção para negociações na etapa "Negociação".

### Solução
Adicionar uma nova seção "Negociações em Andamento" que mostra todas as negociações dos empreendimentos do incorporador que estejam na etapa "Negociação" (independente de terem proposta), permitindo que ele acompanhe e interaja com elas.

### Arquivo: `src/pages/portal-incorporador/PortalIncorporadorPropostas.tsx`
- Adicionar constante `ETAPA_NEGOCIACAO` com o ID correto
- Filtrar negociações na etapa "Negociação" que pertençam aos empreendimentos do incorporador
- Renderizar uma seção "Negociações em Andamento" com os cards correspondentes, antes da seção de propostas em análise

