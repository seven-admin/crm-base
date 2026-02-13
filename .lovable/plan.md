
# Plano: Contadores Financeiros, Unidades por Andar e Otimizacao de Boxes

---

## 1. Corrigir contadores financeiros do Forecast

### Diagnostico
Os KPIs financeiros buscam dados de 3 tabelas:
- **comissoes**: 0 registros no banco. O hook busca `valor_venda` e `valor_comissao` dessa tabela, mas ela esta vazia.
- **negociacoes**: 0 registros no banco.
- **propostas**: 4 registros, todos com status "convertida" (nenhuma "aceita").

Porem existem **448 unidades vendidas** com valor total de ~R$ 151 milhoes. Essas vendas foram registradas via "Venda Historica" (alteracao de status da unidade), sem criar registros em comissoes/negociacoes.

### Correcao
O hook `useForecastFinanceiro.ts` precisa ser atualizado para buscar valor de vendas a partir das **unidades vendidas** (tabela `unidades` com `status = 'vendida'`), alem de manter a busca de comissoes. Tambem deve incluir propostas "convertidas" (nao apenas "aceitas").

**Alteracoes em `src/hooks/useForecastFinanceiro.ts`**:
- Adicionar query para somar `valor` de unidades com `status = 'vendida'`
- Usar o maior valor entre vendas via comissoes e vendas via unidades vendidas (para nao duplicar)
- Alterar filtro de propostas: incluir status `aceita` E `convertida`
- Remover filtro de data das vendas por unidades (vendas historicas nao tem data de venda registrada separadamente)

---

## 2. Unidades agrupadas por andar para predios/edificios

Atualmente, a `UnidadesTab` agrupa unidades por bloco/quadra. Para empreendimentos do tipo `predio` ou `comercial`, a exibicao deve agrupar por **andar** dentro de cada bloco.

### Alteracoes em `src/components/empreendimentos/UnidadesTab.tsx`:

No trecho que renderiza os cards de unidades (linhas 422-481), adicionar logica condicional:
- Se o tipo do empreendimento e `predio` ou `comercial`:
  - Dentro de cada bloco, sub-agrupar as unidades por `andar`
  - Exibir cabecalho "Andar X" antes de cada grupo
  - Ordenar andares numericamente (1, 2, 3...)
  - Dentro de cada andar, ordenar por numero da unidade
- Se o tipo e `loteamento` ou `condominio`: manter o layout atual (sem agrupamento por andar)

Layout visual para predios:
```text
Torre A
  Andar 1
    [101] [102] [103] [104]
  Andar 2
    [201] [202] [203] [204]
  ...
```

---

## 3. Otimizar criacao e vinculacao de boxes

### 3a. Vinculacao em lote de boxes a unidades

Atualmente, vincular um box a uma unidade e feito um a um (clicando no icone de link de cada box). Para otimizar:

**Alteracoes em `src/components/empreendimentos/BoxesTab.tsx`**:
- Adicionar modo de selecao "vincular" (alem do existente "excluir")
- Botao "Vincular em Lote" na toolbar
- Ao ativar, usuario seleciona multiplos boxes disponiveis via checkbox
- Ao confirmar, abre dialog para selecionar a unidade destino
- Todos os boxes selecionados sao vinculados a mesma unidade em uma unica operacao

**Alteracoes em `src/hooks/useBoxes.ts`**:
- Criar hook `useVincularBoxesBatch` que faz update em lote (usando `.in('id', ids)`) para vincular multiplos boxes a uma unidade de uma vez

### 3b. Melhorias na UI de vinculacao

- No dialog de vinculacao, mostrar a unidade com mais contexto (bloco + numero + tipologia)
- Adicionar opcao de "Desvincular em Lote" quando boxes vinculados estao selecionados

---

## Resumo dos arquivos afetados

| Arquivo | Alteracao |
|---------|-----------|
| `src/hooks/useForecastFinanceiro.ts` | Buscar vendas via unidades vendidas + propostas convertidas |
| `src/components/empreendimentos/UnidadesTab.tsx` | Agrupar por andar para predios/edificios |
| `src/components/empreendimentos/BoxesTab.tsx` | Modo de vinculacao em lote + desvincular em lote |
| `src/hooks/useBoxes.ts` | Novo hook `useVincularBoxesBatch` |

Nenhuma alteracao de banco de dados necessaria - todos os campos ja existem.
