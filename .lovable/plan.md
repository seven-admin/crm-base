

# Alterar Gestor/Responsável de Atividades e Planejamento (Super Admin)

## Problema
1. Atividades criadas para o Gilson não tiveram o gestor corrigido para o responsável do empreendimento
2. Super admins não conseguem alterar o gestor responsável de atividades (Diário de Bordo e Forecast) nem do Planejamento

## Alterações

### 1. Seletor de Gestor no Detalhe da Atividade (`AtividadeDetalheDialog.tsx`)
- Na seção onde exibe "Gestor: {nome}", para `super_admin`, substituir o texto estático por um `Select` com a lista de gestores (via `useGestoresProduto`)
- Ao alterar, chamar `updateAtividade.mutate({ id, data: { gestor_id: novoGestorId } })`
- Para não-super_admin, manter exibição somente leitura

### 2. Seletor de Responsável Técnico no Detalhe da Tarefa do Planejamento (`TarefaDetalheDialog.tsx`)
- Na seção de responsáveis, adicionar um `Select` (visível apenas para super_admin) para alterar o `responsavel_tecnico_id`
- Usar `updateItem.mutate({ id: item.id, responsavel_tecnico_id: novoId })` 
- Lista de opções: `useAllProfiles()` (todos os usuários ativos)

### Arquivos afetados
- `src/components/atividades/AtividadeDetalheDialog.tsx` — adicionar Select de gestor para super_admin
- `src/components/planejamento/TarefaDetalheDialog.tsx` — adicionar Select de responsável técnico para super_admin

