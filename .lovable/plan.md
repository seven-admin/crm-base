
# Corrigir Filtro de Comprador Historico e Unificar Criacao de Contrato

## Problema 1: Filtro de Comprador Historico incompleto

O filtro foi aplicado apenas em `useContratos.ts` e `useContratosStats.ts`, mas falta em 4 outros hooks que consultam contratos:

- `src/hooks/useDashboardExecutivo.ts` -- contagem e valores de contratos no dashboard executivo
- `src/hooks/useRelatorios.ts` -- 6 queries diferentes (total vendas, vendas mes, vendas mes anterior, evolucao, por corretor, por empreendimento, ultimas vendas)
- `src/hooks/useDashboardIncorporador.ts` -- contratos em andamento
- `src/hooks/useBonificacoes.ts` -- contagem de unidades vendidas

### Solucao

A abordagem mais sustentavel e criar uma helper function reutilizavel para o filtro, mas como o Supabase JS nao permite subqueries, o filtro precisa ser feito pos-fetch. A melhor opcao e fazer um join com clientes em cada query e filtrar no JS.

Porem, como nem todas as queries fazem join com clientes, a solucao mais pratica e:
1. Buscar os IDs dos clientes historicos uma unica vez
2. Adicionar `.not('cliente_id', 'in', ...)` nas queries

Na verdade, como sao poucos IDs, a solucao mais simples e manter o filtro JS pos-fetch, adicionando o join com `clientes(nome)` onde necessario.

**Arquivos a modificar:**
- `src/hooks/useDashboardExecutivo.ts` -- adicionar join com clientes e filtro
- `src/hooks/useRelatorios.ts` -- adicionar filtro em todas as 6+ queries
- `src/hooks/useDashboardIncorporador.ts` -- adicionar filtro
- `src/hooks/useBonificacoes.ts` -- adicionar filtro

## Problema 2: Contrato nao criado na aprovacao do incorporador

O `useAprovarPropostaIncorporador` move a negociacao para Ganho e marca unidades como vendidas, mas NAO cria contrato. A logica de auto-criacao de contrato so existe em `useMoverNegociacao`.

### Solucao

Adicionar a mesma logica de criacao automatica de contrato no `useAprovarPropostaIncorporador`, reutilizando o mesmo padrao ja existente em `useMoverNegociacao`:

```text
// Apos marcar unidades como vendidas (linha 449):
// Auto-criar contrato
try {
  const { data: contratoCriado } = await db
    .from('contratos')
    .insert({
      numero: 'TEMP',
      cliente_id: negociacao.cliente_id,
      empreendimento_id: negociacao.empreendimento_id,
      corretor_id: negociacao.corretor_id,
      imobiliaria_id: negociacao.imobiliaria_id,
      valor_contrato: negociacao.valor_proposta || negociacao.valor_negociacao,
      negociacao_id: negociacao.id,
      status: 'em_geracao',
    })
    .select('id')
    .single();

  if (contratoCriado && negociacao.unidades?.length > 0) {
    await db.from('contrato_unidades').insert(
      negociacao.unidades.map(u => ({
        contrato_id: contratoCriado.id,
        unidade_id: u.unidade_id,
      }))
    );
  }
} catch (err) {
  console.error('Erro ao auto-criar contrato:', err);
}
```

Tambem adicionar invalidacao das queries de contratos no onSuccess:
```text
queryClient.invalidateQueries({ queryKey: ['contratos'] });
queryClient.invalidateQueries({ queryKey: ['contratos-paginated'] });
queryClient.invalidateQueries({ queryKey: ['contratos-stats'] });
```

## Resumo de arquivos modificados

1. `src/hooks/useDashboardExecutivo.ts` -- filtro comprador historico
2. `src/hooks/useRelatorios.ts` -- filtro comprador historico em 6+ queries
3. `src/hooks/useDashboardIncorporador.ts` -- filtro comprador historico
4. `src/hooks/useBonificacoes.ts` -- filtro comprador historico
5. `src/hooks/useNegociacoes.ts` -- adicionar auto-criacao de contrato no `useAprovarPropostaIncorporador`

## Detalhes tecnicos

### Helper de filtro (padrao a aplicar)

Para queries que ja fazem join com clientes:
```text
const resultado = (data || []).filter(c => 
  !c.cliente?.nome?.toUpperCase().includes('COMPRADOR HISTÓRICO')
);
```

Para queries que NAO fazem join com clientes, adicionar o select de `clientes(nome)` e aplicar o mesmo filtro.

### useDashboardExecutivo.ts

A query de contratos (linha 101-104) nao faz join com clientes. Alterar para:
```text
let contratosQ = supabase
  .from('contratos')
  .select('id, valor_contrato, data_assinatura, empreendimento_id, created_at, cliente:clientes(nome)')
  .eq('is_active', true)
```
E filtrar o resultado.

### useRelatorios.ts

Sao 6+ queries independentes. Cada uma precisa:
1. Adicionar `cliente:clientes(nome)` ao select
2. Filtrar pos-fetch

### useBonificacoes.ts

A query usa `count` (linha 152-155). Como nao retorna dados, precisamos mudar a abordagem:
- Em vez de `select('id', { count: 'exact' })`, buscar os IDs e filtrar, depois contar manualmente.
- Ou: buscar os cliente_ids historicos primeiro e usar `.not('cliente_id', 'in', ...)` para excluir no SQL.

A segunda opcao e mais eficiente. Criar uma funcao utilitaria:
```text
// src/lib/contratoFilters.ts
export async function getClientesHistoricosIds() {
  const { data } = await supabase
    .from('clientes')
    .select('id')
    .ilike('nome', '%COMPRADOR HISTÓRICO%');
  return (data || []).map(c => c.id);
}
```

Usar isso em `useBonificacoes.ts` com `.not('cliente_id', 'in', `(${ids.join(',')})`)`.
