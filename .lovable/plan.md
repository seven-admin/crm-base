

# Correções: Unidades na Proposta + Tipos de Parcela Dinâmicos

## Problemas Identificados

### 1. Unidades não aparecem no PropostaDialog
**Causa raiz**: Quando uma atividade cria automaticamente uma negociação (`useAtividades.ts`, linhas 279-289), ela insere apenas dados básicos na tabela `negociacoes` — **nenhum registro é criado em `negociacao_unidades`**. O `useNegociacao` busca corretamente, mas não há dados de unidades no banco.

A imagem mostra "Unidades" vazio e valores 0 porque a negociação realmente não tem unidades associadas.

**Solução**: O PropostaDialog precisa permitir selecionar unidades quando não existem. Adicionar um seletor de unidades do empreendimento quando `neg.unidades` está vazio, e salvar em `negociacao_unidades` antes de gerar a proposta.

### 2. Tipos de Parcela hardcoded — CRUD em /tipos-parcela não reflete nos formulários
**Causa raiz**: O arquivo `src/types/condicoesPagamento.types.ts` define `TIPOS_PARCELA` como array hardcoded com 6 valores fixos. Todos os 4 formulários de condições de pagamento usam esse array para popular os selects:
- `CondicoesPagamentoInlineEditor.tsx` (contratos)
- `CondicaoPagamentoForm.tsx` (contratos)
- `LocalCondicoesPagamentoEditor.tsx` (negociações)
- `NegociacaoCondicoesPagamentoInlineEditor.tsx` (negociações)

O CRUD `/tipos-parcela` edita a tabela `tipos_parcela` no banco, mas **nenhum formulário consulta essa tabela**.

**Solução**: Substituir o uso do array hardcoded `TIPOS_PARCELA` por dados dinâmicos do hook `useTiposParcela()` (que já existe em `useCondicoesPagamento.ts`).

---

## Plano de Implementação

### Arquivo 1: `src/components/negociacoes/PropostaDialog.tsx`
- Adicionar hook `useUnidadesEmpreendimento` para buscar unidades disponíveis do empreendimento
- Quando `neg.unidades` estiver vazio, exibir um seletor multi-select de unidades com checkbox
- Ao selecionar unidades, inserir registros em `negociacao_unidades` via mutation existente
- Calcular `valorTabela` a partir das unidades selecionadas

### Arquivo 2: `src/components/negociacoes/NegociacaoCondicoesPagamentoInlineEditor.tsx`
- Importar `useTiposParcela` de `useCondicoesPagamento`
- Substituir `TIPOS_PARCELA.map(...)` por `tiposParcela?.map(tp => tp.codigo)` nos 2 selects
- Substituir `TIPO_PARCELA_LABELS[x]` por lookup dinâmico `tiposParcela?.find(t => t.codigo === x)?.nome`

### Arquivo 3: `src/components/negociacoes/LocalCondicoesPagamentoEditor.tsx`
- Mesma substituição: `useTiposParcela` + lookup dinâmico

### Arquivo 4: `src/components/contratos/CondicoesPagamentoInlineEditor.tsx`
- Mesma substituição

### Arquivo 5: `src/components/contratos/CondicaoPagamentoForm.tsx`
- Mesma substituição

### Arquivo 6: `src/components/negociacoes/PropostaCondicoesEditor.tsx`
- Mesma substituição (exibe badges com labels dinâmicos)

### Arquivo 7: `src/components/propostas/ApresentacaoDialog.tsx`
- Substituir `TIPO_PARCELA_LABELS[...]` por lookup dinâmico

---

## Detalhes Técnicos

### Seletor de Unidades no PropostaDialog
```typescript
// Buscar unidades disponíveis do empreendimento
const { data: unidadesDisponiveis } = useQuery({
  queryKey: ['unidades-empreendimento', neg?.empreendimento_id],
  enabled: !!neg?.empreendimento_id && open,
  queryFn: async () => {
    const { data } = await supabase.from('unidades')
      .select('id, numero, valor, bloco:blocos(nome)')
      .eq('empreendimento_id', neg.empreendimento_id)
      .eq('status', 'disponivel');
    return data;
  }
});
```

### Padrão de substituição dos tipos de parcela (em cada formulário)
```typescript
// Antes:
import { TIPOS_PARCELA, TIPO_PARCELA_LABELS } from '@/types/condicoesPagamento.types';
// ...
{TIPOS_PARCELA.map(t => <SelectItem key={t} value={t}>{TIPO_PARCELA_LABELS[t]}</SelectItem>)}

// Depois:
import { useTiposParcela } from '@/hooks/useCondicoesPagamento';
// ...
const { data: tiposParcela = [] } = useTiposParcela();
// ...
{tiposParcela.map(t => <SelectItem key={t.codigo} value={t.codigo}>{t.nome}</SelectItem>)}

// Para labels em badges:
const getTipoParcelaLabel = (codigo: string) =>
  tiposParcela.find(t => t.codigo === codigo)?.nome || codigo;
```

O array `TIPOS_PARCELA` e o objeto `TIPO_PARCELA_LABELS` continuam existindo como fallback, mas os formulários passam a usar dados do banco.

