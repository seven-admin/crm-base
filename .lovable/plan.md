
# Correcao completa do modulo de Metas Comerciais

## Problemas identificados

### Problema 1: Dashboard mostra "Meta nao definida" mesmo com metas criadas
O hook `useMetasPorMes` filtra `empreendimento_id=is.null` quando o filtro esta em "Todos os empreendimentos". Porem, todas as 3 metas existentes tem `empreendimento_id` preenchido (VITHORIA DO SOL e LIVTY). Resultado: retorna array vazio `[]`.

O usuario quer que "Todos os empreendimentos" **consolide** todas as metas (de todos os empreendimentos + gerais).

### Problema 2: Grafico historico vazio pelo mesmo motivo
O hook `useHistoricoMetas` tambem filtra `.is('empreendimento_id', null)` quando nao ha filtro de empreendimento, perdendo as metas vinculadas a empreendimentos.

### Problema 3: Tabela "Gerenciar Metas" nao mostra coluna Tipo
A tabela retorna os dados corretamente (3 registros), mas nao exibe a coluna "Tipo" (comercial / atividades), dificultando a visualizacao.

### Problema 4: Unique index removido
A migration `20260302153108` removeu o unique index e nao recriou com a coluna `tipo`. Isso permite registros duplicados.

## Plano de correcao

### 1. Refatorar `useMetasPorMes` para consolidar tudo quando sem filtro de empreendimento

**Arquivo:** `src/hooks/useMetasComerciais.ts` (linhas 42-81)

Remover o filtro `.is('empreendimento_id', null)` quando `empreendimentoId` nao e passado. Assim, todas as metas do mes serao somadas (de todos os empreendimentos + gerais).

```typescript
// ANTES:
if (empreendimentoId) {
  query = query.eq('empreendimento_id', empreendimentoId);
} else {
  query = query.is('empreendimento_id', null); // <-- REMOVE ISSO
}

// DEPOIS:
if (empreendimentoId) {
  query = query.eq('empreendimento_id', empreendimentoId);
}
// Sem filtro = consolida todas as metas do mes
```

### 2. Refatorar `useHistoricoMetas` da mesma forma

**Arquivo:** `src/hooks/useMetasComerciais.ts` (linhas 221-225)

Remover o filtro `.is('empreendimento_id', null)` quando nao ha filtro de empreendimento, para que o grafico historico tambem consolide.

```typescript
// ANTES:
if (empreendimentoId) {
  metaQuery = metaQuery.eq('empreendimento_id', empreendimentoId);
} else {
  metaQuery = metaQuery.is('empreendimento_id', null); // REMOVE
}

// DEPOIS:
if (empreendimentoId) {
  metaQuery = metaQuery.eq('empreendimento_id', empreendimentoId);
}
```

### 3. Adicionar coluna "Tipo" na tabela de Gerenciar Metas

**Arquivo:** `src/pages/MetasComerciais.tsx` (linhas 633-714)

Adicionar uma coluna "Tipo" no TableHeader e TableBody da tabela de "Gerenciar Metas" mostrando uma badge com "Comercial" ou "Atividades".

### 4. Recriar unique index incluindo coluna `tipo`

**Migration SQL:**

```sql
CREATE UNIQUE INDEX IF NOT EXISTS metas_comerciais_unique_comp_emp_cor_ges_per_tipo
ON public.metas_comerciais (
  competencia,
  COALESCE(empreendimento_id, '00000000-0000-0000-0000-000000000000'),
  COALESCE(corretor_id, '00000000-0000-0000-0000-000000000000'),
  COALESCE(gestor_id, '00000000-0000-0000-0000-000000000000'),
  periodicidade,
  tipo
);
```

Isso permite ter uma meta "comercial" e uma "atividades" para o mesmo mes/escopo, sem duplicatas.

## Resumo das alteracoes

| Arquivo | Mudanca |
|---------|---------|
| `src/hooks/useMetasComerciais.ts` | Remover filtro `is('empreendimento_id', null)` em `useMetasPorMes` e `useHistoricoMetas` quando sem filtro |
| `src/pages/MetasComerciais.tsx` | Adicionar coluna "Tipo" na tabela de Gerenciar Metas |
| Migration SQL | Recriar unique index incluindo coluna `tipo` |
