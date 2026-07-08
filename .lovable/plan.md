## Objetivo

Migrar todo o código (frontend + edge functions) para usar os novos nomes de tabela (`seven_*`, `sistema_*`) e, ao final, **remover as views de compatibilidade**.

## Escopo

- **40 arquivos** no `src/` com `.from('<nome_antigo>')`.
- **4 edge functions** com `.from('<nome_antigo>')`: `register-imobiliaria`, `delete-imobiliaria`, `register-corretor`, `create-corretor`.
- Nenhuma referência antiga em SQL do frontend (não usamos RPC com nome de tabela em string).

## Mapeamento de renomes

**Seven (25):**
```text
empreendimentos              → seven_empreendimentos
blocos                       → seven_blocos
unidades                     → seven_unidades
tipologias                   → seven_tipologias
boxes                        → seven_boxes
fachadas                     → seven_fachadas
mapa_empreendimento          → seven_mapa_empreendimento
empreendimento_documentos    → seven_empreendimento_documentos
empreendimento_midias        → seven_empreendimento_midias
empreendimento_corretores    → seven_empreendimento_corretores
empreendimento_imobiliarias  → seven_empreendimento_imobiliarias
clientes                     → seven_clientes
cliente_telefones            → seven_cliente_telefones
cliente_socios               → seven_cliente_socios
cliente_interacoes           → seven_cliente_interacoes
corretores                   → seven_corretores
imobiliarias                 → seven_imobiliarias
incorporadoras               → seven_incorporadoras
unidade_historico_precos     → seven_unidade_historico_precos
centros_custo                → seven_centros_custo
centro_custo_empreendimentos → seven_centro_custo_empreendimentos
plano_contas                 → seven_plano_contas
lancamentos_financeiros      → seven_lancamentos_financeiros
saldos_mensais               → seven_saldos_mensais
configuracao_comercial       → seven_configuracao_comercial
```

**Sistema (7):**
```text
modules                    → sistema_modules
role_permissions           → sistema_role_permissions
user_module_permissions    → sistema_user_module_permissions
user_empreendimentos       → sistema_user_empreendimentos
audit_logs                 → sistema_audit_logs
notificacoes               → sistema_notificacoes
configuracoes_sistema      → sistema_configuracoes
```

Preservados (não trocar): `profiles`, `roles`, `user_roles`, `arqo_*`, `nexa_*`, `arqo_vw_forecast_ponderado`.

## Execução

### Passo 1 — Substituição em massa
Script `sed` iterando o mapeamento acima:
- Alvo: `src/**/*.{ts,tsx}` e `supabase/functions/**/*.ts`.
- Padrão exato: `.from('<antigo>')` e `.from("<antigo>")` → `.from('<novo>')`.
- Só ocorrências literais dentro de `.from(...)` — não mexemos em nomes de arquivo, comentários, strings de UI, rotas, permissões, ícones ou variáveis.
- Também substituir referências a nomes de tabela em `foreignTable:` / `referencedTable:` se existirem (a checar durante execução).

### Passo 2 — Ajustes específicos
- Verificar joins embutidos no formato `select('*, tabela(*)')`: nesses casos o Supabase JS aceita nome de tabela como alias de FK; se houver, também trocar (`, clientes(` → `, seven_clientes(` etc.).
- Rodar `bunx tsgo --noEmit` — o `types.ts` regenerado terá apenas os novos nomes (após drop das views). Qualquer referência esquecida acusa erro de tipo.

### Passo 3 — Drop das views (migration)
Após o `tsgo` passar sem erros, uma segunda migration:
```sql
DROP VIEW IF EXISTS public.<nome_antigo> CASCADE;  -- x32
```
`CASCADE` só afeta views/objetos que dependam da view — nada mais depende delas hoje.

### Passo 4 — Regenerar types.ts
Automático após o drop. Passa a listar só os nomes novos.

### Passo 5 — Validação
- `bunx tsgo --noEmit` limpo.
- Abrir manualmente: `/`, `/empreendimentos`, `/clientes`, `/arqo/leads`, `/nexa/agenda`, `/usuarios`.
- Rodar `supabase--linter` para conferir se não sobrou nada quebrado.

## Riscos

- **Joins com nome de tabela como alias** (`select('*, clientes(nome)')`) podem estar espalhados. O `sed` cobre os `.from(...)`; farei uma varredura extra para `, <antigo>(` e `, <antigo>!` (foreign hint) e trocarei também.
- **Se algum arquivo importar tipos do `types.ts` pelo nome antigo** (`Database['public']['Tables']['clientes']`), quebra. Farei busca prévia por esse padrão antes do drop e ajusto se houver.

## Arquivos afetados

- ~40 arquivos em `src/` (edição em massa via sed).
- 4 edge functions.
- 1 migration final (`DROP VIEW`).
- `src/integrations/supabase/types.ts` regenerado.
