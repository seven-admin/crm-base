

# Destaque de Atividades

## Objetivo
Adicionar um campo `destaque` (boolean) na tabela `atividades` e na interface, permitindo marcar atividades importantes com visual diferenciado (borda colorida, ícone de estrela, etc).

## Alterações

### 1. Banco de Dados
- Adicionar coluna `destaque boolean default false` na tabela `atividades`

### 2. Tipos (`src/types/atividades.types.ts`)
- Adicionar `destaque?: boolean` nas interfaces `Atividade` e `AtividadeFormData`

### 3. Formulário (`src/components/atividades/AtividadeForm.tsx`)
- Adicionar um toggle/switch "Marcar como destaque" (com ícone de estrela) no formulário de criação/edição

### 4. Cards e Listagens
- **AtividadeKanbanCard.tsx** — Adicionar borda amarela/dourada e ícone de estrela quando `destaque = true`
- **AtividadeCard.tsx** — Mesmo tratamento visual: borda destacada + badge/ícone de estrela

### 5. Hook de Atividades
- Garantir que o campo `destaque` seja incluído nas queries e mutations existentes (insert/update)

### Resultado Visual
Atividades com destaque terão uma borda dourada (`border-amber-400`) e um ícone de estrela (★) no canto superior, tornando-as facilmente identificáveis tanto no Kanban quanto na lista.

