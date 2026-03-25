

# Correção dos filtros e contadores de Negociações

## Problemas identificados

### 1. `!inner` join excluindo negociações sem cliente (causa do NEG-00192 sumir)
Na query paginada (lista/tabela), a linha `clientes!inner(...)` usa um **INNER JOIN**, o que significa que qualquer negociação **sem cliente vinculado** simplesmente desaparece dos resultados. O Kanban usa join normal (sem `!inner`), por isso a mesma negociação pode aparecer no Kanban mas não na lista.

### 2. Count query não faz join com clientes
A query de contagem (`countQuery`) não faz join com a tabela `clientes`, mas tenta filtrar por `cliente.nome` e `cliente.temperatura`. Isso falha silenciosamente no PostgREST, resultando em contadores incorretos quando os filtros de busca ou temperatura estão ativos.

### 3. Inconsistência count vs data
Por causa dos problemas acima, o total exibido nos cards de métricas pode divergir do número real de registros na tabela.

## Solução

### Arquivo: `src/hooks/useNegociacoes.ts`

**Query de dados paginada (dataQuery):**
- Trocar `clientes!inner(...)` por `clientes(...)` (LEFT JOIN), garantindo que negociações sem cliente apareçam normalmente

**Query de contagem (countQuery):**
- Adicionar join com clientes na select: `select('id, cliente:clientes(nome, temperatura)', { count: 'exact', head: true })`
- Isso permite que os filtros `search` (ilike cliente.nome) e `temperatura` funcionem corretamente na contagem

**Resultado esperado:**
- NEG-00192 e qualquer negociação sem cliente passará a aparecer na lista
- Contadores ficarão consistentes com os dados exibidos
- Filtros de busca por nome e temperatura funcionarão corretamente em ambas as views

