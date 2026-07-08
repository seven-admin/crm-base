
## Ajustes de layout

### 1. Topbar nas páginas Nexa
Envolver as 4 páginas Nexa (`NexaAgenda`, `NexaVisitaDetalhe`, `NexaDisponibilidade`, `NexaContratos`) em `<MainLayout>` — mesmo padrão do Arqo. Isso resolve o sumiço da topbar e traz de volta a navegação.

### 2. Remover ícone de perfil do topo, mover ações para "Sistema"
Em `AppTopbar.tsx`:
- Remover o `DropdownMenu` do usuário (avatar redondo com iniciais).
- Adicionar ao grupo **Sistema** dois novos itens especiais renderizados no dropdown do grupo:
  - Cabeçalho com nome e cargo do usuário logado.
  - Item "Sair" (com `LogOut`, cor destructive, executa `signOut`).
- Como esses itens não são rotas de navegação normal, adicionar suporte a `MenuItem` com `onClick` opcional (ou renderização custom no final do grupo Sistema) — implementado como bloco extra dentro do `DropdownMenuContent` quando `group.label === 'Sistema'`.

### 3. Alinhamento: logo à esquerda, menu à direita, logo menor
- Trocar `flex-1 justify-center` do `<nav>` por `ml-auto` para empurrar tudo para a direita.
- Reduzir logo de `h-7` para `h-5` (também no mobile sheet).
- Container principal continua `justify-between` para posicionar logo à esquerda e bloco (nav + mobile trigger) à direita.

### Detalhes técnicos
- Nenhuma mudança de schema.
- Sem alteração em Sidebar (topbar é o menu principal em uso).
- Import de `User` pode ser removido; `LogOut` continua necessário.
