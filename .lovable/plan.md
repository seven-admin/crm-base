
# Correcao do cadastro de metas e graficos

## Problema identificado

### Erro ao salvar metas (causa raiz)
O upsert em `useCreateMeta` e `useCopiarMetas` usa `onConflict: 'metas_comerciais_unique_comp_emp_cor_ges_per'`, que referencia um **indice unico com expressoes COALESCE**. O PostgREST/Supabase JS **nao suporta** upsert em indices com expressoes -- so funciona com constraints simples. Isso causa erro 400/409 ao tentar salvar qualquer meta.

Alem disso, existe uma constraint duplicada `metas_comerciais_unique_key` (sem `gestor_id` e sem `tipo`), o que pode gerar conflitos inesperados.

### Graficos vazios
Com apenas 1 registro de meta no banco (semanal, para um empreendimento especifico), os hooks de dashboard (`useHistoricoMetas`, `useMetasPorMes`) retornam vazio para metas mensais/gerais, exibindo "Sem dados" nos graficos.

## Plano de correcao

### Etapa 1 -- Corrigir constraint unica no banco (migration SQL)
- Remover o indice com expressao `metas_comerciais_unique_comp_emp_cor_ges_per`
- Remover a constraint legada `metas_comerciais_unique_key` (que nao inclui `gestor_id` nem `tipo`)
- Criar nova constraint **real** (nao indice) que funcione com PostgREST:

```sql
-- Remover indice com expressao (incompativel com upsert)
DROP INDEX IF EXISTS metas_comerciais_unique_comp_emp_cor_ges_per;

-- Remover constraint legada incompleta
ALTER TABLE metas_comerciais DROP CONSTRAINT IF EXISTS metas_comerciais_unique_key;

-- Adicionar colunas com defaults para NULLs, permitindo constraint simples:
-- Abordagem: usar constraint parcial nao e possivel com upsert.
-- Solucao: mudar a logica do frontend para fazer select + insert/update manual
```

**Problema:** colunas nullable (`empreendimento_id`, `corretor_id`, `gestor_id`) fazem com que `NULL != NULL` em constraints UNIQUE, impedindo deteccao de duplicatas. A unica solucao confiavel e **abandonar o upsert** e fazer select-then-insert/update no codigo.

### Etapa 2 -- Alterar `useCreateMeta` para select + insert/update
**Arquivo:** `src/hooks/useMetasComerciais.ts`

Mudanca na `mutationFn`:
1. Fazer um `select` filtrando por `competencia`, `periodicidade`, `empreendimento_id` (ou `is null`), `corretor_id` (ou `is null`), `gestor_id` (ou `is null`) e `tipo`
2. Se encontrar registro: fazer `update` no id encontrado
3. Se nao encontrar: fazer `insert`
4. Remover o `upsert` com `onConflict`

Mesma logica para `useCopiarMetas`.

### Etapa 3 -- Limpar indices/constraints duplicados (migration SQL)
- Remover `metas_comerciais_unique_comp_emp_cor_ges_per` (indice com expressao)
- Remover `metas_comerciais_unique_key` (constraint legada sem gestor/tipo)
- Manter apenas a PK

### Etapa 4 -- Revisar graficos
Os graficos ja funcionam corretamente em termos de codigo. O problema e ausencia de dados. Com o cadastro corrigido, ao criar metas mensais os graficos (`useHistoricoMetas`, `useMetasVsRealizadoPorEmpreendimento`) passarao a exibir dados automaticamente.

Nao ha alteracoes necessarias nos componentes de graficos.

## Resumo de arquivos impactados
- `src/hooks/useMetasComerciais.ts`: refatorar `useCreateMeta` e `useCopiarMetas` (upsert -> select+insert/update)
- Nova migration SQL: remover indices/constraints incompativeis

## Resultado esperado
- Cadastro de metas funciona sem erro para qualquer combinacao de escopo (geral, empreendimento, gestor)
- Metas duplicadas sao atualizadas corretamente (comportamento de upsert manual)
- Graficos exibem dados assim que metas mensais forem cadastradas
