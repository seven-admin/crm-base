## Situação atual

A migração do frontend + edge functions já foi executada no turno anterior:

- 40+ arquivos em `src/**/*.ts(x)` reescritos (`.from('clientes')` → `.from('seven_clientes')`, etc.)
- 6 edge functions reescritas (`create-corretor`, `create-user`, `delete-imobiliaria`, `delete-user`, `register-corretor`, `register-imobiliaria`)
- Joins embutidos em `select(...)` reescritos (ex.: `blocos(nome)` → `seven_blocos(nome)`)
- Views antigas dropadas na migration `20260708210518`
- `types.ts` regenerado
- `tsgo --noEmit` limpo

Verificação agora: `rg` não encontra nenhuma referência remanescente aos nomes antigos de tabela.

## O que fazer neste passo

Como não há código antigo pendente, o plano é apenas **validar em execução** que nada quebrou depois da queda das views:

1. Abrir o preview nas rotas principais (Empreendimentos, Clientes, Corretores, Unidades, Financeiro, Notificações) via Playwright headless.
2. Coletar erros de console e respostas HTTP 4xx/5xx do Supabase.
3. Se aparecer alguma tabela antiga em erro (ex.: um `.rpc()` que referencia nome antigo internamente, ou string dinâmica que o `sed` não pegou), corrigir pontualmente.
4. Rodar `supabase--linter` para confirmar que não sobrou RLS órfão.

Nenhuma nova migration deve ser necessária. Se algo aparecer, corrijo no ponto exato.

## Detalhes técnicos

- Preservados intactos: `profiles`, `roles`, `user_roles`, `arqo_*`, `nexa_*`.
- Edge functions afetadas serão redeployadas automaticamente ao editar; se algo falhar, uso `supabase--edge_function_logs` para diagnosticar.
- Caso surja erro do tipo `relation "xxx" does not exist`, é sinal de string dinâmica (template literal) que escapou do `sed` — corrijo caso a caso.
