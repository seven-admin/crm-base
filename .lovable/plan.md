Refatorar a página de login (`/auth`) para um layout minimalista e centralizado, usando a logo oficial da Seven Group enviada pelo usuário e removendo as logos antigas do sistema.

## Objetivo
- Centralizar o formulário de login no meio da tela, sem painel lateral.
- Exibir a logo positiva da Seven Group no topo do formulário.
- Remover as demais logos antigas da Seven (`logo-full.png`, `logo.png`, `logo-icon.png`, `logo-sevengroup.png`), mantendo apenas a versão oficial.
- Preservar todas as funcionalidades de login, recuperação de senha e cadastro.

## Arquivos envolvidos
- `src/components/auth/LoginForm.tsx` — refatoração do layout.
- `src/pages/Auth.tsx` — ajuste do wrapper, se necessário.
- `src/assets/logo*.png` — remoção dos arquivos não utilizados.
- Verificação em `index.html`, `App.tsx`, `MainLayout.tsx`, `AppTopbar.tsx` e outros componentes para garantir que nenhuma logo antiga esteja referenciada.

## Mudanças técnicas

### 1. Layout centralizado do login
- Substituir a estrutura de duas colunas por um único container centralizado (`min-h-screen flex items-center justify-center`).
- Remover o painel lateral escuro com gradientes, círculos e grid decorativo.
- Manter o card de login com `max-w-sm` e padding responsivo.

### 2. Logo oficial
- Usar a logo enviada (`Logo_Positiva_•_Seven_Group.png`) como asset principal.
- Converter para asset CDN via `lovable-assets` e criar o ponteiro `src/assets/logo-sevengroup.png.asset.json` (ou reutilizar/renomear o asset existente).
- Exibir a logo no topo do formulário, com largura adequada (~200-240px) e `alt` descritivo.
- Remover o texto "Seven Group 360" do cabeçalho mobile, pois a logo o substitui.

### 3. Remoção de logos antigas
- Apagar os arquivos:
  - `src/assets/logo-full.png`
  - `src/assets/logo.png`
  - `src/assets/logo-icon.png`
  - `src/assets/logo-sevengroup.png` (versão antiga, substituída pela enviada)
- Antes da remoção, verificar referências em:
  - `index.html` (favicon, apple-touch-icon, etc.)
  - `src/App.tsx`, `src/main.tsx`
  - `src/components/layout/AppTopbar.tsx`
  - `src/components/layout/MainLayout.tsx`
  - Outros componentes que possam importar essas imagens.
- Caso `logo-icon.png` seja usado como favicon, substituir por um ícone baseado na logo oficial ou manter temporariamente até novo favicon ser definido.

### 4. Simplificação do formulário
- Manter campos de email e senha, botão "Entrar", link "Esqueci minha senha" e bloco de recuperação.
- Preservar mensagens de erro, estados de loading e validação com Zod.
- Manter links de cadastro de imobiliária/corretor quando as props forem fornecidas.
- Manter o copyright no rodapé.

### 5. Ajustes no `Auth.tsx`
- Garantir que o wrapper ocupe a tela inteira sem quebras visuais.
- Preservar redirecionamento para a rota padrão quando o usuário já estiver autenticado.

## Critérios de aceitação
- A página `/auth` exibe o formulário centralizado vertical e horizontalmente.
- A logo positiva da Seven Group aparece no topo do card de login.
- O painel lateral escuro não é mais renderizado.
- Login, erro de credenciais, recuperação de senha e cadastro continuam funcionando.
- As logos antigas são removidas sem deixar referências quebradas no projeto.
- Layout responsivo em telas pequenas.