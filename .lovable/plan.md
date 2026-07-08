## Objetivo

Padronizar prefixos de tabelas: `seven_*` para domínio de negócio Seven, `sistema_*` para infra/plataforma. **Preservar** `profiles`, `roles`, `user_roles` (afetariam o auth) e `arqo_*` / `nexa_*` (já prefixados).

## Categorização final

**Renomear para `seven_*` (25 tabelas):**
`empreendimentos`, `blocos`, `unidades`, `tipologias`, `boxes`, `fachadas`, `mapa_empreendimento`, `empreendimento_documentos`, `empreendimento_midias`, `empreendimento_corretores`, `empreendimento_imobiliarias`, `clientes`, `cliente_telefones`, `cliente_socios`, `cliente_interacoes`, `corretores`, `imobiliarias`, `incorporadoras`, `unidade_historico_precos`, `centros_custo`, `centro_custo_empreendimentos`, `plano_contas`, `lancamentos_financeiros`, `saldos_mensais`, `configuracao_comercial`.

**Renomear para `sistema_*` (5 tabelas):**
`modules`, `role_permissions`, `user_module_permissions`, `user_empreendimentos`, `audit_logs`, `notificacoes`, `configuracoes_sistema` (essa vira `sistema_configuracoes` para evitar duplicação de "sistema").

**Preservar (não renomear):**
`profiles`, `roles`, `user_roles` (auth), `arqo_*`, `nexa_*`.

## Estratégia de execução — Views (baixo risco)

Renomear ~30 tabelas fisicamente e reescrever ~500+ queries no frontend em uma tacada é altíssimo risco de quebra em cascata. Faremos assim:

### Fase 1 — Migração de banco (uma única migration)

1. `ALTER TABLE <antigo> RENAME TO <novo>` para cada tabela.
2. Foreign keys, RLS policies, triggers, sequences, índices seguem automaticamente (Postgres atualiza referências internas).
3. **Criar VIEWS com os nomes antigos** apontando para as novas tabelas (`CREATE VIEW empreendimentos AS SELECT * FROM seven_empreendimentos;`), com `GRANT` equivalente e `SECURITY INVOKER` para respeitar RLS da tabela base.
4. Atualizar todas as **funções SECURITY DEFINER** que fazem `FROM <tabela>` para usar o novo nome (has_role, is_admin, get_user_imobiliaria_id, get_gestor_empreendimento, user_has_empreendimento_access, get_unidades_disponiveis, arqo_atribuir_lead_roleta, get_or_create_pessoa, validate_*, uppercase_*, auto_set_gestor_id_clientes, prevent_gestor_id_change, arqo_transicionar_status, get_module_scope, can_access_module*, get_user_module_permission, get_cidades_corretores, get_imobiliarias_ativas, get_corretor_ids_by_user, is_gestor_imobiliaria, is_seven_team, is_incorporador, is_cliente_externo).
5. Recriar triggers apontando para os novos nomes de tabela.

**Resultado após Fase 1:** o app **continua funcionando sem mudança de código** porque as views antigas espelham as tabelas novas. Novas tabelas já ficam com nome final; frontend pode migrar gradualmente.

### Fase 2 — Regenerar types.ts

O `src/integrations/supabase/types.ts` é regenerado automaticamente pelo Supabase após a migration. Ele passará a listar **tanto** as tabelas novas (`seven_*`, `sistema_*`) **quanto** as views antigas (nomes originais) — o TypeScript aceita as duas.

### Fase 3 — Migração do código (posterior, opcional)

Substituir gradualmente `.from('empreendimentos')` → `.from('seven_empreendimentos')` etc. via search/replace por módulo. Como as views continuam existindo, nada quebra durante a transição. Quando 100% do código estiver migrado, dropamos as views em uma segunda migration.

Nesta primeira entrega faremos **apenas a Fase 1 + Fase 2**. O código do frontend não muda.

## Riscos e mitigações

- **Edge functions** que usam nomes antigos → continuam funcionando via views.
- **RLS policies** → seguem automaticamente com o rename; validaremos via `supabase--linter` após aplicar.
- **Funções SECURITY DEFINER com search_path fixo** → precisam ser recriadas com nome novo; incluídas na migration.
- **Views vs. políticas RLS** → todas as views serão criadas como `SECURITY INVOKER` (padrão em PG 15+) para herdar RLS das tabelas base.
- **Nomes ambíguos**: `configuracoes_sistema` → `sistema_configuracoes` (evita `sistema_configuracoes_sistema`).

## Verificação após aplicar

1. Rodar `supabase--linter` para conferir se nenhuma policy/função ficou órfã.
2. Abrir 5 telas críticas: `/empreendimentos`, `/clientes`, `/arqo/leads`, `/nexa/agenda`, `/usuarios` — devem carregar normalmente (via views).
3. Confirmar login/logout (auth intocado).
4. Testar criar 1 cliente, 1 lead Arqo, 1 visita Nexa (write path via views).

## Arquivos afetados

- **1 migration** (via `supabase--migration`): renames + views + recriação das SECURITY DEFINER functions.
- **`src/integrations/supabase/types.ts`**: regenerado automaticamente.
- **Nenhum arquivo de código do frontend** nesta fase.
