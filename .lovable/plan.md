
# Filtrar Comprador Historico e Integrar Contratos ao Fluxo de Ganho

## Problema 1: Comprador Historico aparece na lista e dashboards de contratos

A screenshot mostra contratos vinculados a "COMPRADOR HISTORICO (PRE-SISTEMA)" na lista e nos contadores. Esses registros sao de vendas historicas importadas e nao devem aparecer nas listagens normais nem inflar os KPIs.

## Problema 2: Coluna Unidades explodindo o layout

Contratos com muitas unidades (ex: JD. IGUATEMI com centenas) mostram todos os numeros em texto corrido, quebrando o layout da tabela.

## Problema 3: Criacao automatica de contrato ao ganhar negociacao

Atualmente o checkbox "Criar contrato automaticamente" e opcional no MoverNegociacaoDialog. O pedido e que ao mover para "Ganho", o contrato seja criado automaticamente.

---

## Alteracoes

### 1. Filtrar Comprador Historico nos hooks de contratos

**Arquivo: `src/hooks/useContratos.ts`**

Adicionar filtro nas queries `useContratos` e `useContratosPaginated` para excluir contratos cujo cliente seja "COMPRADOR HISTORICO (PRE-SISTEMA)":

```text
// Na query, apos .eq('is_active', true), adicionar:
.not('cliente_id', 'in', `(select id from clientes where nome ilike '%COMPRADOR HISTÓRICO%')`)
```

Como o Supabase JS nao suporta subqueries inline facilmente, a abordagem sera filtrar no frontend apos o fetch, ou usar um filtro via join. A solucao mais simples e filtrar os resultados no JS:

```text
const resultado = (data || []).filter(c => 
  !c.cliente?.nome?.toUpperCase().includes('COMPRADOR HISTÓRICO')
);
```

Isso sera aplicado em:
- `useContratos` (linha 44-46)
- `useContratosPaginated` (linha 89-97)

**Arquivo: `src/hooks/useContratosStats.ts`**

Adicionar o mesmo filtro nos dados do dashboard, excluindo contratos com cliente historico de todos os calculos (total, porStatus, valorPipeline, etc.):

```text
const contratosValidos = (contratos || []).filter(c => 
  !c.cliente?.nome?.toUpperCase().includes('COMPRADOR HISTÓRICO')
);
```

### 2. Truncar coluna de Unidades na tabela

**Arquivo: `src/components/contratos/ContratosTable.tsx`**

Em vez de listar todas as unidades em texto corrido, truncar com limite e mostrar contagem:

```text
// Antes
const unidades = contrato.unidades?.map(u => u.unidade?.numero).filter(Boolean).join(', ') || '-';

// Depois
const unidadesList = contrato.unidades?.map(u => u.unidade?.numero).filter(Boolean) || [];
const MAX_SHOW = 5;
const unidades = unidadesList.length <= MAX_SHOW
  ? unidadesList.join(', ')
  : `${unidadesList.slice(0, MAX_SHOW).join(', ')} +${unidadesList.length - MAX_SHOW}`;
```

Aplicar tanto na versao desktop (linha 227) quanto mobile (linha 178). Adicionar `max-w-[200px] truncate` na celula para garantir que nao estoure.

### 3. Auto-criar contrato ao mover para Ganho

**Arquivo: `src/hooks/useNegociacoes.ts`**

No `useMoverNegociacao`, apos a movimentacao para etapa `is_final_sucesso` (linha 1173), adicionar logica para criar o contrato automaticamente sem precisar do checkbox:

```text
// Apos marcar unidades como vendidas (linha 1187)
if (targetEtapa?.is_final_sucesso) {
  // ... codigo existente de unidades ...
  
  // Auto-criar contrato
  try {
    const { data: negCompleta } = await db
      .from('negociacoes')
      .select('cliente_id, empreendimento_id, corretor_id, imobiliaria_id, valor_negociacao, valor_proposta, status_proposta')
      .eq('id', id)
      .single();

    if (negCompleta) {
      // Se tem proposta aceita, usar converterNegociacaoEmContrato
      // Senao, criar contrato diretamente
      await db.from('contratos').insert({
        numero: 'TEMP',
        cliente_id: negCompleta.cliente_id,
        empreendimento_id: negCompleta.empreendimento_id,
        corretor_id: negCompleta.corretor_id,
        imobiliaria_id: negCompleta.imobiliaria_id,
        valor_contrato: negCompleta.valor_proposta || negCompleta.valor_negociacao,
        negociacao_id: id,
        status: 'em_geracao',
      });
    }
  } catch (err) {
    console.error('Erro ao auto-criar contrato:', err);
  }
}
```

Tambem remover o checkbox "Criar contrato automaticamente" do `MoverNegociacaoDialog.tsx` ja que agora e automatico, substituindo por um aviso informativo:

```text
// Substituir o bloco do Checkbox (linhas 146-162) por:
<div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg text-sm text-blue-700 dark:text-blue-300">
  Um contrato sera criado automaticamente ao confirmar.
</div>
```

### Arquivos modificados

- `src/hooks/useContratos.ts` -- filtrar comprador historico
- `src/hooks/useContratosStats.ts` -- filtrar comprador historico dos KPIs
- `src/components/contratos/ContratosTable.tsx` -- truncar unidades
- `src/hooks/useNegociacoes.ts` -- auto-criar contrato no Ganho
- `src/components/negociacoes/MoverNegociacaoDialog.tsx` -- remover checkbox, adicionar aviso
