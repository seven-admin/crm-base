## Diagnóstico

`/empreendimentos` retorna vazio porque a policy RLS chama `user_has_empreendimento_access()` e essa função (junto com várias outras) ainda referencia os **nomes antigos** de tabelas (ex.: `public.user_empreendimentos`, `public.corretores`, `public.imobiliarias`). Como as views antigas foram derrubadas, todo `SELECT` em `seven_empreendimentos` explode com `42P01: relation "public.user_empreendimentos" does not exist` — e o PostgREST devolve erro que a UI trata como lista vazia.

Confirmei chamando o REST direto:
```
GET /rest/v1/seven_empreendimentos?is_active=eq.true
→ {"code":"42P01","message":"relation \"public.user_empreendimentos\" does not exist"}
```

## Correção

Migration que recria (`CREATE OR REPLACE FUNCTION`) todas as funções SQL que ainda usam nomes antigos, apontando para os nomes novos.

Funções a atualizar:

| Função | Referência antiga → nova |
|---|---|
| `user_has_empreendimento_access` | `user_empreendimentos` → `sistema_user_empreendimentos`; `corretores` → `seven_corretores`; `empreendimento_imobiliarias` → `seven_empreendimento_imobiliarias`; `imobiliarias` → `seven_imobiliarias` |
| `can_access_empreendimento` | `user_empreendimentos` → `sistema_user_empreendimentos` |
| `can_access_module` | `role_permissions`/`modules` → `sistema_role_permissions`/`sistema_modules` |
| `can_access_module_v2` | `user_module_permissions`/`modules`/`role_permissions` → `sistema_*` |
| `get_user_module_permission` | `user_module_permissions`/`modules` → `sistema_*` |
| `get_module_scope` | `role_permissions`/`modules` → `sistema_*` |
| `get_gestor_empreendimento` | `user_empreendimentos` → `sistema_user_empreendimentos` |
| `get_user_imobiliaria_id` | `imobiliarias` → `seven_imobiliarias` |
| `get_imobiliarias_ativas` | `imobiliarias` → `seven_imobiliarias` |
| `get_corretor_ids_by_user` | `corretores` → `seven_corretores` |
| `get_cidades_corretores` | `corretores`/`imobiliarias` → `seven_*` |
| `get_or_create_pessoa` | `clientes` → `seven_clientes` |
| `get_unidades_disponiveis` | `unidades`/`empreendimentos`/`incorporadoras`/`blocos`/`tipologias` → `seven_*` |
| `ensure_single_principal_telefone` | `cliente_telefones` → `seven_cliente_telefones` |
| `generate_cod_sorteio` | `corretores` → `seven_corretores` |
| `audit_trigger_func` | `audit_logs` → `sistema_audit_logs` |

Nada de código frontend muda nesta etapa — o problema é 100% dentro do banco.

## Validação

Após a migration:
1. `curl` no endpoint REST de `seven_empreendimentos` deve devolver JSON com registros (não mais 42P01).
2. Playwright em `/empreendimentos` deve renderizar cards em vez de "Nenhum empreendimento encontrado".
