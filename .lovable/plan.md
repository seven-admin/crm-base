
# Correcao da exibicao de Metas no Dashboard

## Problema identificado

As metas criadas nao aparecem no dashboard por **3 razoes distintas**:

### 1. Filtro de periodicidade incompativel
O hook `useMetasPorMes` filtra por `periodicidade = 'mensal'` (valor padrao), mas as metas criadas sao **semanais**. O dashboard nunca passa o parametro de periodicidade, entao sempre busca metas mensais.

### 2. Filtro de competencia incompativel para metas semanais
Para metas mensais, o hook converte a data para `startOfMonth` (ex: `2026-03-01`). Metas semanais tem competencia no dia da segunda-feira (ex: `2026-03-02`), entao nunca sao encontradas pelo filtro de igualdade.

### 3. Grafico historico ignora metas de atividades
O hook `useHistoricoMetas` verifica `resultado.some(r => r.meta > 0)` olhando apenas `meta_valor`. Metas do tipo "atividades" tem `meta_valor = 0` (usam `meta_visitas`, `meta_atendimentos` etc.), entao o grafico retorna vazio.

**Dados atuais no banco:**
- Meta `b7b19c6e`: semanal, empreendimento `156f9324`, tipo atividades, meta_valor=0, meta_visitas=4, meta_atendimentos=10
- Meta `014bd07e`: semanal, empreendimento `f2208f56`, tipo comercial, meta_valor=0, meta_unidades=4, meta_atendimentos=20

## Plano de correcao

### 1. Refatorar `useMetasPorMes` para suportar ambas periodicidades

Alterar o hook para buscar **todas as metas do mes** (tanto mensais quanto semanais que caem dentro do mes), em vez de filtrar por periodicidade exata.

**Arquivo:** `src/hooks/useMetasComerciais.ts`

Mudanca: em vez de `eq('competencia', competenciaStr)` com `eq('periodicidade', periodicidade)`, usar `gte/lte` para buscar metas com competencia dentro do mes selecionado e agregar os valores.

```typescript
// Buscar todas metas do mes (mensais + semanais)
const inicio = format(startOfMonth(competencia), 'yyyy-MM-dd');
const fim = format(endOfMonth(competencia), 'yyyy-MM-dd');

let query = supabase
  .from('metas_comerciais')
  .select('*')
  .gte('competencia', inicio)
  .lte('competencia', fim);
```

Depois agregar os valores de todas as metas encontradas (somando meta_valor, meta_unidades, meta_visitas etc.) para apresentar um consolidado no dashboard.

### 2. Corrigir `useHistoricoMetas` para considerar metas de atividades

Alterar a condicao de retorno vazio para verificar **qualquer** campo de meta, nao apenas `meta_valor`:

```typescript
const temAlgumaMeta = resultado.some(r => r.meta > 0 || r.metaVisitas > 0 || r.metaAtendimentos > 0);
```

Ou, mais simples: retornar os dados sempre que existam metas no periodo, sem filtrar por `meta_valor > 0`.

### 3. Atualizar os KPIs do dashboard para metas de atividades

Atualmente os cards mostram apenas "Meta Valor" e "Meta Unidades". Para metas do tipo "atividades", o dashboard deve tambem exibir informacoes de visitas e atendimentos quando relevante.

Adicionar logica condicional nos cards KPI:
- Se a meta consolidada tem `meta_valor > 0`: exibir VGV e unidades (como esta hoje)
- Se a meta consolidada tem `meta_visitas > 0` ou `meta_atendimentos > 0`: exibir tambem esses indicadores

### 4. Ajustar `useMetasVsRealizadoPorEmpreendimento`

Mesmo problema: filtra por `competencia` exata (startOfMonth). Alterar para usar range `gte/lte` do mes, igual ao item 1.

## Resumo das alteracoes

| Arquivo | Mudanca |
|---------|---------|
| `src/hooks/useMetasComerciais.ts` | Refatorar `useMetasPorMes` para buscar metas no range do mes e agregar |
| `src/hooks/useMetasComerciais.ts` | Corrigir `useHistoricoMetas` para considerar metas de atividades |
| `src/hooks/useMetasComerciais.ts` | Ajustar `useMetasVsRealizadoPorEmpreendimento` para range de datas |
| `src/pages/MetasComerciais.tsx` | Adicionar exibicao de KPIs de atividades (visitas, atendimentos) quando aplicavel |
