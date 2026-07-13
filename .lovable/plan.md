## Nova página Nexa: "Render Vithória"

Página simples dentro do módulo Nexa que apenas embarca (via iframe fullscreen) o sistema externo `https://render.sistemasvn.com.br/empreendimento/vithoria-do-sol`. Aberta a todos os usuários Nexa (`nexa_admin`, `nexa_gestor`, `nexa_corretor`), sem restrição extra por permissão de módulo.

### 1. Nova página
- Criar `src/pages/nexa/NexaRenderVithoria.tsx`
- Layout: header curto com título "Render Vithória" + `<iframe>` ocupando o restante da altura útil (`h-[calc(100vh-...)]`, `w-full`, sem borda, `allow="fullscreen"`, `allowFullScreen`).

### 2. Rota
- Em `src/App.tsx`, adicionar rota `/nexa/render-vithoria` envolvida por `<NexaProtectedRoute>` **sem** `moduleName` (assim libera para qualquer role Nexa, sem depender de módulo cadastrado em `sistema_modules`).

### 3. Menu no topo (AppTopbar)
- Em `src/components/layout/AppTopbar.tsx`, dentro do grupo "Nexa", incluir novo item:
  - label: `Render Vithória`
  - path: `/nexa/render-vithoria`
  - `moduleName: '__self__'` (mesmo truque do "Meu Perfil") para o filtro `filterItems` não bloquear pela ausência de módulo cadastrado — o gate já é feito pelo `NexaProtectedRoute` + `canAccessGroup('nexa')`.
  - ícone: `ExternalLink` (lucide).

### Fora de escopo
- Nada de banco de dados, RLS, permissões novas ou tratamento de SSO para o sistema externo. Se o site externo bloquear iframes via `X-Frame-Options`/CSP, será necessário liberar do lado deles — mencionarei isso ao entregar.
