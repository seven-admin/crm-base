

# Resetar senha de corretores e imobiliárias

## Situação atual
- A edge function `reset-user-password` já existe e funciona (reseta para `Seven@1234`)
- A página `/usuarios` e o componente `CorretoresUsuariosTab` já usam essa função
- A página `/corretores` **não** tem botão de reset de senha (só editar e excluir)
- A página `/imobiliarias` **não** tem botão de reset de senha

## Plano

### 1. Página `/corretores` — adicionar botão "Resetar Senha"
Na coluna de ações da tabela, para corretores que têm `user_id` (com conta de acesso), adicionar um botão com ícone de chave que:
- Exibe `confirm()` com aviso da senha padrão
- Chama `supabase.functions.invoke('reset-user-password', { body: { user_id } })`
- Exibe toast de sucesso/erro

### 2. Página `/imobiliarias` — adicionar botão "Resetar Senha" 
Na coluna de ações da tabela, para imobiliárias que têm `user_id` (gestor com conta), adicionar botão similar.
- Precisará que a query de imobiliárias inclua o campo `user_id` (verificar se já vem)

### Arquivos a modificar
- `src/pages/Corretores.tsx` — estado + handler + botão na tabela
- `src/pages/Imobiliarias.tsx` — estado + handler + botão na tabela

Não é necessário criar migrations ou edge functions novas; a infraestrutura já existe.

