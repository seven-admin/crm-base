
## 1. Vínculo por Empresa (Company / Tipo de Usuário)

Adicionar um novo campo `empresa` no `profiles`, com as opções:

- `seven` — enxerga tudo (equivalente ao staff interno)
- `arqo` — só vê menu **Arqo** + configuração do próprio perfil
- `nexa` — só vê menu **Nexa** + configuração do próprio perfil
- `incorporador` — só verá dashboards dedicados (a serem criados depois)
- `externo` — reservado, sem acesso agora (redireciona para /sem-acesso)

### Banco
- Migration: `ALTER TABLE public.profiles ADD COLUMN empresa TEXT NOT NULL DEFAULT 'seven' CHECK (empresa IN ('seven','arqo','nexa','incorporador','externo'));`
- Backfill inicial pelo `role` atual:
  - roles `arqo_*` → empresa `arqo`
  - roles `nexa_*` → empresa `nexa`
  - role `incorporador` → empresa `incorporador`
  - role `cliente_externo` → empresa `externo`
  - demais → empresa `seven`
- Helper SQL: `public.get_user_empresa(_user_id uuid)` (security definer).

### Frontend
- `AuthContext`: carregar `profile.empresa` e expor no contexto.
- Novo hook `useEmpresaAccess()` com flags: `isSeven`, `isArqo`, `isNexa`, `isIncorporador`, `isExterno`.
- **AppTopbar** (menu principal): filtrar grupos pela empresa antes de filtrar por role/módulo:
  - `seven` → Seven (mega-menu) + Arqo + Nexa + Sistema (super_admin/admin)
  - `arqo` → só grupo Arqo + item "Meu Perfil" no menu Sistema
  - `nexa` → só grupo Nexa + item "Meu Perfil" no menu Sistema
  - `incorporador` → só grupo "Dashboards" (placeholder por ora) + Meu Perfil
  - `externo` → nenhum menu, redireciona
- `useDefaultRoute`: rota padrão por empresa (arqo → /arqo/roleta, nexa → /nexa/agenda, incorporador → /portal-incorporador, externo → /sem-acesso).
- `ProtectedRoute`: bloquear rotas fora da empresa do usuário.
- Tela **Usuários** (`src/pages/Usuarios.tsx` / `UserPermissionsTab`): novo Select "Empresa" no cadastro/edição, salvando em `profiles.empresa`.

## 2. Remover aceite de Política de Privacidade

Do que existe hoje:
- Tabelas no banco: `termos_aceites` e `termos_versoes` (RLS + policies).
- Nenhum uso no frontend (não há hook nem modal ativos).
- Páginas públicas `/termos` e `/privacidade` **serão mantidas** (rodapé/legal), só o aceite obrigatório é removido.

Ações:
- Migration: `DROP TABLE public.termos_aceites CASCADE; DROP TABLE public.termos_versoes CASCADE;` (junto com policies).
- Garantir que Auth/Login não exija checkbox de aceite (revisar `LoginForm.tsx`, `CorretorRegisterForm.tsx`, `ImobiliariaRegisterForm.tsx`) e remover qualquer checkbox/validação de "aceito os termos".
- Manter os links das páginas legais no rodapé sem tornar obrigatórios.

## 3. Completar menu Sistema

Hoje o menu Sistema tem apenas: Auditoria, Usuários. Componentes prontos mas sem rota: `RolesManager`, `SidebarColorsConfig`, gestão de módulos/permissões.

Adicionar:
- **Meu Perfil** (`/configuracoes?tab=perfil`) — disponível para todos, edita nome/email/senha.
- **Papéis (Roles)** — nova página `/configuracoes/papeis` montando `RolesManager` (super_admin).
- **Módulos & Permissões** — página `/configuracoes/permissoes` (super_admin) com gestão dos módulos `sistema_modules` e `sistema_role_permissions`.
- **Configurações Gerais** — `/configuracoes` (super_admin), incluindo o `SidebarColorsConfig` e demais `sistema_configuracoes`.
- **Auditoria** (já existe).
- **Usuários** (já existe).

Todas essas entradas aparecem no dropdown Sistema do `AppTopbar`, escondidas por `adminOnly` conforme o caso; usuários `arqo`/`nexa` verão apenas "Meu Perfil".

## Detalhes técnicos

- Alterações concentradas em: `AuthContext.tsx`, `hooks/usePermissions.ts`, novo `hooks/useEmpresaAccess.ts`, `components/layout/AppTopbar.tsx`, `components/auth/ProtectedRoute.tsx`, `hooks/useDefaultRoute.ts`, `pages/Usuarios.tsx`, `pages/Configuracoes*.tsx` (novas), `App.tsx` (novas rotas).
- Não vou mexer em RLS além de derrubar termos_aceites — a segmentação por empresa fica no front + `ProtectedRoute`; se depois quisermos endurecer no banco, criamos policies extras.
- Manter compatibilidade com os roles existentes (empresa é um "eixo" novo, ortogonal ao role).
