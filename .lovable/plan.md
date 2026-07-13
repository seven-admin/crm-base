## Problema 1 — `comercial@nexaresolve.com.br` não altera status de unidades

O usuário tem role `nexa_gestor` (empresa `nexa`, ativo). Em `src/pages/nexa/NexaDisponibilidade.tsx` a regra é:

```
canEdit = (isNexa || isSeven) && (isAdmin() || isSuperAdmin())
```

`isAdmin()` só retorna `true` para `admin`/`super_admin`, então `nexa_gestor` cai no modo somente leitura (filtra apenas `disponivel` e mostra Badge, sem popover).

**Correção:** liberar edição também para `nexa_gestor` (e manter admin/super_admin Seven). Nova regra:

```
canEdit = isSuperAdmin() || isAdmin() || (isNexa && role === 'nexa_gestor')
```

- Também remover o filtro `['disponivel']` quando `canEdit=true` (já está correto).
- Verificar rapidamente RLS de `seven_unidades` UPDATE — se hoje só admin passa, adicionar policy que permite `nexa_gestor` atualizar `status` (via `has_role(auth.uid(),'nexa_gestor')`). Confirmar via `supabase--read_query` antes de decidir se precisa de migration.

## Problema 2 — Módulos antigos poluindo `/usuarios` (perfis e edição individual)

`sistema_modules` hoje tem 34 módulos ativos, mas o app real usa apenas 10 rotas com `moduleName`:

**Manter (ativos):**
`dashboard`, `empreendimentos`, `unidades`, `clientes`, `usuarios`, `incorporadoras`, `imobiliarias`, `corretores`, `auditoria`, `portal_incorporador`

**Desativar (não existem mais no código):**
`agenda`, `atividades`, `bonificacoes`, `comissoes`, `contratos`, `contratos_templates`, `contratos_tipos_parcela`, `contratos_variaveis`, `empreendimentos_comissoes`, `empreendimentos_config`, `financeiro_dre`, `financeiro_fluxo`, `forecast`, `negociacoes`, `negociacoes_config`, `portal_cliente`, `portal_corretor`, `propostas`, `relatorios`, `relatorios_financeiros`, `reservas`, `solicitacoes`, `configuracoes` (não é gated por módulo), `config_negociacoes` (já inativo)

Arqo e Nexa não usam `sistema_modules` (têm `ArqoProtectedRoute` / `NexaProtectedRoute` por empresa+role), portanto não precisam entrar na lista.

**Ação:** migration marcando `is_active=false` nos módulos obsoletos (não apagar para preservar histórico de permissões). Isso já esconde eles automaticamente em `/usuarios?tab=perfis` e na edição individual, pois ambos consultam `sistema_modules` com `is_active=true`.

## Passos

1. Editar `src/pages/nexa/NexaDisponibilidade.tsx`: expandir `canEdit` para incluir `nexa_gestor`.
2. Confirmar via `supabase--read_query` a policy de UPDATE em `seven_unidades`; se restringir apenas admin, criar migration adicionando policy para `nexa_gestor`.
3. Migration: `UPDATE sistema_modules SET is_active=false WHERE name IN (...lista acima)`.
4. Verificar que `/usuarios?tab=perfis` mostra apenas os 10 módulos ativos.
