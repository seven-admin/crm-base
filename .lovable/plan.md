## Objetivo
Criar a página `/configuracoes` (ainda inexistente, apesar de o link já estar na Sidebar) com um sistema de abas, começando pela aba **Domínios Google permitidos** — CRUD completo da tabela `sistema_dominios_google_permitidos`, restrita a `super_admin`.

## Arquivos a criar

1. **`src/pages/Configuracoes.tsx`**
   - Layout `MainLayout` com título "Configurações" e subtítulo curto.
   - Componente `Tabs` do shadcn sincronizado com a query string `?tab=...` (assim o link atual da Sidebar `?tab=perfil` continua válido).
   - Abas iniciais:
     - `perfil` — placeholder simples (link para `/meu-perfil`) para não quebrar o link atual.
     - `dominios-google` — nova aba, só aparece se `isSuperAdmin()`.
   - Deixa estrutura pronta para futuras abas (roles, notificações, cores, etc.).

2. **`src/components/configuracoes/DominiosGoogleTab.tsx`**
   - Lista em tabela: colunas Domínio, Empresa, Ativo, Ações.
   - Botão "Novo domínio" no topo abre `Dialog` de criação.
   - Cada linha tem: `Switch` de ativo (toggle inline), botão Editar (abre dialog), botão Excluir (`AlertDialog` de confirmação).
   - Formulário (novo/editar):
     - `dominio` (input, obrigatório, salvo em lowercase, validação regex simples de domínio).
     - `empresa_default` (select: seven, arqo, nexa, incorporador, externo).
     - `descricao` (input opcional).
     - `is_active` (switch, default true).
   - Mensagens de erro amigáveis (ex.: domínio duplicado → "Este domínio já está cadastrado").

3. **`src/hooks/useDominiosGoogle.ts`**
   - `useDominiosGoogle()` — `select *` da tabela ordenado por `dominio`.
   - `useUpsertDominioGoogle()` — insert/update com `onSuccess` invalidando a query e mostrando toast.
   - `useDeleteDominioGoogle()` — delete + toast.
   - `useToggleDominioGoogleAtivo()` — update apenas `is_active` para o switch inline.

## Segurança
- Aba escondida no frontend via `usePermissions().isSuperAdmin()`.
- RLS existente da tabela já restringe escrita a `super_admin` (política `Somente super_admin gerencia dominios`), então a proteção real está no banco — o gate do frontend é apenas UX.
- Leitura é pública (necessário para o fluxo de login Google validar o domínio antes de autenticar).

## Ajustes menores
- **`src/App.tsx`**: registrar a rota `/configuracoes` → `Configuracoes` dentro de `ProtectedRoute`.
- **`src/components/layout/Sidebar.tsx`**: manter o item existente; opcionalmente adicionar um subitem "Domínios Google" visível só para super_admin apontando para `/configuracoes?tab=dominios-google`.

## Observações
- Nenhuma migration necessária — a tabela e as políticas já existem.
- Os três domínios padrão (`sevengroup360.com.br`, `nexaresolve.com.br`, `arqoimob.com.br`) continuam pré-cadastrados e passam a ser editáveis pela UI.