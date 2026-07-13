## Problema

Usuários novos com roles Arqo/Nexa caem em `/sem-acesso` porque essas roles têm 0 permissões em `sistema_role_permissions`. Além disso, há perfis legados sem uso que poluem o cadastro.

## Escopo

### 1. Migration — remover perfis legados

Deletar da tabela `roles` (com cascade em `user_roles` e `sistema_role_permissions`):

- **Sem usuários (inativos):** `diretor_de_marketing`, `supervisão_de_criação`, `incorporador`
- **Sem usuários (ativo):** `gestor_produto`
- **Com usuários vinculados (limpar antes):** `gestor_imobiliaria` (202 usuários) — remove `user_roles` correspondentes; os perfis dos usuários permanecem mas ficam sem role.

Mantém: `admin`, `super_admin`, `arqo_admin`, `arqo_gestor`, `arqo_consultor`, `arqo_closer`, `nexa_admin`, `nexa_gestor`, `nexa_corretor`, `corretor` (mantido; 169 users, inativo — legado que ainda precisa aparecer para gestão).

### 2. Migration — semear permissões para Arqo/Nexa

Insere em `sistema_role_permissions` (idempotente com `ON CONFLICT DO NOTHING`):

**Módulos Arqo** (atividades, clientes, forecast, negociações, propostas, solicitacoes, dashboard):
- `arqo_admin`, `arqo_gestor` → view + create + edit + delete, scope `all`
- `arqo_consultor`, `arqo_closer` → view + create + edit, scope `own` (delete = false)

**Módulos Nexa** (agenda, unidades, empreendimentos, contratos, contratos_templates, contratos_variaveis, contratos_tipos_parcela, dashboard, reservas):
- `nexa_admin`, `nexa_gestor` → view + create + edit + delete, scope `all`
- `nexa_corretor` → view + create + edit, scope `own` (delete = false)

Módulos administrativos (`configuracoes`, `usuarios`, `auditoria`, `relatorios`) ficam restritos a `admin`/`super_admin` (já configurados).

### 3. Retroativo — ativar usuários existentes

`UPDATE profiles SET is_active = true` para os dois usuários já criados (`af6e4a8a-…` e `ada2428e-…`), garantindo que possam acessar imediatamente após as novas permissões.

### 4. Edge Function `create-user` — fallback

Ajustar `supabase/functions/create-user/index.ts`: se `permCount === 0` e não vier `base_role_id`, semear `can_view=true` no módulo `dashboard` para a role, evitando futuros usuários travados caso uma nova role seja criada sem configuração.

## Detalhes técnicos

- Migration única, ordem: (a) DELETE `user_roles` de `gestor_imobiliaria`, (b) DELETE roles legadas, (c) INSERT permissões Arqo/Nexa, (d) UPDATE profiles ativos.
- Nenhuma alteração em RLS ou grants.
- Após aprovação, os dois usuários já cadastrados poderão logar diretamente.
