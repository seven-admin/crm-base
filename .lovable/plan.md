## Objetivo

Gerar um único arquivo de migration consolidado contendo todo o schema atual do banco de dados Supabase do projeto (tabelas, enums, funções, triggers, policies, grants, sequences e buckets de storage), servindo como snapshot/baseline.

## Abordagem

1. **Extrair o schema completo** do banco Supabase atual (project ref `pizerpoxuqopekmbvohh`) via `supabase--read_query` consultando `pg_catalog` / `information_schema`:
   - Enums (`pg_type` + `pg_enum`)
   - Sequences
   - Tabelas do schema `public` (colunas, defaults, nullables, PKs, FKs, uniques, checks)
   - Funções (`pg_proc`) — já temos a lista em contexto
   - Triggers (`pg_trigger`)
   - Policies RLS (`pg_policies`)
   - Grants (`information_schema.role_table_grants`)
   - Buckets de storage (`storage.buckets`)

2. **Montar SQL consolidado** na ordem correta para ser idempotente/executável do zero:
   ```
   1) CREATE TYPE (enums)
   2) CREATE SEQUENCE
   3) CREATE TABLE  (~100 tabelas em public)
   4) GRANT por tabela
   5) ALTER TABLE ... ENABLE ROW LEVEL SECURITY
   6) CREATE FUNCTION  (todas as ~70 funções)
   7) CREATE TRIGGER
   8) CREATE POLICY
   9) INSERT em storage.buckets (buckets existentes)
   ```

3. **Gravar o arquivo** em `supabase/migrations/<timestamp>_baseline_full_schema.sql` via `supabase--migration` (o tool cria o arquivo). Como é apenas snapshot do que já existe, o SQL usará `CREATE ... IF NOT EXISTS` / `CREATE OR REPLACE` onde aplicável para não quebrar em ambiente que já tem o schema aplicado.

## Detalhes técnicos

- O arquivo será grande (estimativa 4–8k linhas SQL) dado o volume: ~100 tabelas, ~70 funções, centenas de policies.
- Não rodaremos `DROP` de nada — somente criação idempotente.
- Triggers e policies referenciam funções, então virão depois das funções.
- Não incluiremos dados (apenas metadados de buckets), pois o pedido é "banco de dados" estrutural.
- Edge functions, secrets e arquivos do `supabase/config.toml` ficam fora do escopo (não são SQL).

## Pontos a confirmar antes de executar

Antes de gerar o arquivo gostaria de confirmar:

1. **Finalidade**: é para servir como baseline/backup do schema (rodar em um projeto Supabase novo e recriar tudo), ou apenas documentação?
2. **Dados**: incluir apenas estrutura (DDL), ou também seeds de tabelas de configuração como `roles`, `modules`, `role_permissions`, `planejamento_status`, `funis`, `funil_etapas`, `tipos_parcela`, etc.?
3. **Idempotência**: usar `CREATE ... IF NOT EXISTS` (seguro de rodar em DB existente) ou `DROP ... CASCADE` antes (recria do zero, destrutivo)?

Com essas respostas eu gero o arquivo na sequência.