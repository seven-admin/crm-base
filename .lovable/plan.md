

# Responsáveis múltiplos em Atividades

## Objetivo
Permitir vincular múltiplas pessoas a uma atividade (não apenas o gestor único via `gestor_id`), com a lista de responsáveis mostrando todos os usuários ativos da equipe Seven.

## Abordagem
Seguir o mesmo padrão já existente no Planejamento (`planejamento_item_responsaveis` + `ResponsaveisEditor` + `usePlanejamentoItemResponsaveis`), criando uma tabela análoga para atividades.

## Alterações

### 1. Banco de Dados
Criar tabela `atividade_responsaveis`:
- `id uuid PK`
- `atividade_id uuid FK → atividades(id) ON DELETE CASCADE`
- `user_id uuid FK → profiles(id) ON DELETE CASCADE`
- `created_at timestamptz`
- Constraint UNIQUE(atividade_id, user_id)
- RLS: authenticated pode CRUD (mesmas regras das atividades)

### 2. Hook `useAtividadeResponsaveis`
Criar hook análogo ao `usePlanejamentoItemResponsaveis`, com:
- Query dos responsáveis com join em `profiles`
- Mutations: `addResponsavel`, `removeResponsavel`
- Invalidação de queries de atividades

### 3. Componente `AtividadeResponsaveisEditor`
Criar componente reutilizável (inspirado no `ResponsaveisEditor` do planejamento):
- Popover com lista de responsáveis atuais (avatar + nome + botão remover)
- Select para adicionar novos responsáveis
- Lista de usuários: **todos os profiles ativos** (usando `useAllProfiles` de `useFuncionariosSeven.ts`)

### 4. Integrar no Detalhe da Atividade
Em `AtividadeDetalheDialog.tsx`:
- Adicionar o `AtividadeResponsaveisEditor` na seção de informações (ao lado do gestor existente ou substituindo), permitindo adicionar/remover responsáveis diretamente

### 5. Integrar no Formulário
Em `AtividadeForm.tsx`:
- Após salvar a atividade, permitir vincular responsáveis (ou adicionar seção no formulário para pré-selecionar)

### 6. Exibir nos Cards
Em `AtividadeCard.tsx` e `AtividadeKanbanCard.tsx`:
- Mostrar avatares empilhados dos responsáveis (como já é feito no planejamento)

### Arquivos afetados
- Nova migration SQL (tabela + RLS)
- `src/hooks/useAtividadeResponsaveis.ts` (novo)
- `src/components/atividades/AtividadeResponsaveisEditor.tsx` (novo)
- `src/components/atividades/AtividadeDetalheDialog.tsx`
- `src/components/atividades/AtividadeCard.tsx`
- `src/components/atividades/AtividadeKanbanCard.tsx`
- `src/components/atividades/AtividadeForm.tsx`

