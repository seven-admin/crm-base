

# Implementar Recuperação de Senha pelo Usuário ("Esqueci minha senha")

## Situação atual
- Existe apenas reset administrativo (admin reseta para `Seven@1234`)
- Não há link "Esqueci minha senha" na tela de login
- Não há página `/reset-password` para o usuário definir nova senha

## O que implementar

### 1. Link "Esqueci minha senha" na tela de login
- Adicionar link abaixo do campo de senha em `src/components/auth/LoginForm.tsx`
- Ao clicar, exibir um campo para digitar o email e enviar o link de recuperação
- Usar `supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + '/reset-password' })`

### 2. Página `/reset-password`
- Criar `src/pages/ResetPassword.tsx`
- Detectar token de recuperação na URL (`type=recovery` no hash)
- Formulário com "Nova senha" e "Confirmar senha"
- Chamar `supabase.auth.updateUser({ password })` para salvar
- Redirecionar para login após sucesso

### 3. Rota pública
- Adicionar rota `/reset-password` em `App.tsx` (fora de rotas protegidas)

### Arquivos alterados
- `src/components/auth/LoginForm.tsx` — adicionar link e modal/estado para solicitar recuperação
- `src/pages/ResetPassword.tsx` — nova página
- `src/App.tsx` — nova rota pública

### Detalhes técnicos
- Supabase Auth já suporta `resetPasswordForEmail` nativamente — envia email com link de recuperação
- O email é enviado pelo próprio Supabase (ou templates customizados se configurados)
- A página `/reset-password` deve ser pública (sem autenticação) pois o usuário não está logado
- Toda comunicação é em português (pt-BR)

