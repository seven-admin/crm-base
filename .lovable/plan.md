

# Diagnóstico profundo: Fluxo de Propostas e Conversão de Atividades

## Problemas Identificados

### 1. PropostaDialog exibe dados incompletos (valores 0, sem unidades)
**Causa raiz**: A página de Negociações usa `useNegociacoesKanban` que carrega dados leves para performance. Essa query seleciona `unidades:negociacao_unidades(id)` — apenas o ID, sem dados da unidade (número, bloco, valor). Também não inclui `valor_tabela`, `data_validade_proposta` nem outros campos de proposta.

Quando o `PropostaDialog` abre a partir do Kanban, recebe esse objeto leve. O `useEffect` (linha 68-84) tenta calcular valores a partir de `negociacao.unidades` mas os campos `valor_tabela`, `valor` e `numero` simplesmente não existem no payload kanban.

**Resultado**: Empreendimento aparece, mas unidades ficam vazias, valores ficam 0, como na imagem enviada.

### 2. "Ver Proposta" no NegociacaoDetalheDialog não funciona adequadamente
O botão chama `handleEditarProposta` que abre `PropostaDialog` com `mode='view'` — mas com os mesmos dados leves do kanban. Mesmo problema do item 1.

### 3. KanbanColumn (antigo) não passa callbacks de proposta
O componente `KanbanColumn.tsx` + `KanbanCard.tsx` (usados pelo `KanbanBoard.tsx` antigo) não repassam `onGerarProposta`, `onEnviarParaAnalise`, etc. O `KanbanBoard.tsx` antigo **não é mais usado** (nenhum import encontrado), mas permanece no código como dead code.

### 4. Botão "Recusar" no PropostaDialog reabre o mesmo dialog
Na linha 374: `onClick={() => onOpenChange(true)}` — isto simplesmente chama `onOpenChange(true)` que não muda o `mode` para `'recusar'`. O botão Recusar no footer do modo view é inoperante.

### 5. Criação automática de negociação (atividades) funciona mas com limitação de dedup
A dedup no `useAtividades.ts` verifica duplicidade apenas na `etapa_inicial`. Se o usuário já moveu a negociação para outra etapa e cria nova atividade do mesmo cliente/empreendimento, uma nova negociação duplicada é criada na etapa inicial.

---

## Plano de Correção

### Arquivo 1: `src/components/negociacoes/PropostaDialog.tsx`
- Adicionar `useNegociacao(negociacao?.id)` para buscar dados completos quando o dialog abre
- Usar os dados completos para popular valores, unidades e informações do empreendimento
- Corrigir o botão "Recusar" para alternar o mode internamente via estado local ao invés de chamar `onOpenChange`

### Arquivo 2: `src/hooks/useNegociacoes.ts` (ajuste menor na query kanban)
- Expandir a query kanban para incluir campos mínimos de proposta: `valor_tabela`, `valor_proposta`, `data_validade_proposta`, `motivo_contra_proposta`, `empreendimento_id`
- Expandir unidades no kanban para: `negociacao_unidades(id, unidade_id, valor_tabela, valor_proposta, unidade:unidades(id, numero, bloco:blocos(nome)))`

### Arquivo 3: Limpeza de dead code
- Remover `KanbanBoard.tsx`, `KanbanColumn.tsx` e `KanbanCard.tsx` antigos de `src/components/negociacoes/` (não são mais importados)

---

## Detalhes Técnicos

### PropostaDialog — fetch completo
```typescript
// Adicionar no topo do componente:
const { data: negociacaoCompleta } = useNegociacao(
  open && negociacao?.id ? negociacao.id : undefined
);
const neg = negociacaoCompleta || negociacao;
// Usar 'neg' em todo o componente ao invés de 'negociacao'
```

### Correção do botão Recusar
```typescript
// Adicionar estado local:
const [internalMode, setInternalMode] = useState(mode);
useEffect(() => { setInternalMode(mode); }, [mode]);

// Botão Recusar:
<Button variant="destructive" onClick={() => setInternalMode('recusar')}>
```

### Query kanban expandida
```sql
unidades:negociacao_unidades(
  id, unidade_id, valor_tabela, valor_proposta, valor_unidade,
  unidade:unidades(id, numero, valor, bloco:blocos(nome))
)
```
Mais campos no select principal: `valor_tabela, valor_proposta, data_validade_proposta, motivo_contra_proposta, empreendimento_id, cliente_id, desconto_percentual`

