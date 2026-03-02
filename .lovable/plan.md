
# Remover Paginação da Lista de Atividades Quando Gestor Selecionado

## O que será feito

Na página de Atividades (`/atividades`), na view "Lista", quando o filtro de "Responsável" (gestor) estiver selecionado, a paginação será removida e todas as atividades daquele gestor serão exibidas de uma vez.

## Alteração

**Arquivo:** `src/pages/Atividades.tsx`

1. Quando `filters.responsavel_id` estiver definido, usar um `pageSize` muito grande (ex: 9999) para trazer todos os resultados de uma vez
2. Esconder o componente `PaginationControls` quando um responsável estiver selecionado
3. Esconder o seletor de "itens por página" quando um responsável estiver selecionado

### Detalhes técnicos

- Modificar o `pageSize` efetivo passado para `useAtividades`: quando `filters.responsavel_id` existir, usar 9999 em vez do `pageSize` do estado
- Condicionar a renderização do `PaginationControls` (linha 1033) para não aparecer quando `filters.responsavel_id` estiver definido
- Condicionar o seletor de itens por página (linha 583) para não aparecer quando `filters.responsavel_id` estiver definido
