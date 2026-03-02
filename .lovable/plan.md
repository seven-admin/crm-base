
# Aumentar Largura dos Cards no Kanban de Atividades

## Problema
Os cards do Kanban em `/atividades` estao com largura de 288px (`w-72`), causando quebra de layout nos badges de temperatura e outros elementos.

## Alteracao

**Arquivo:** `src/components/ui/kanban/KanbanColumn.tsx`
- Alterar `sm:w-72` para `sm:w-80` (320px)

**Arquivo:** `src/components/ui/kanban/KanbanBoard.tsx`
- Alterar `w-72` no skeleton de loading para `w-80`

Isso dara 32px extras de largura, suficiente para acomodar os badges de temperatura sem quebrar linha.
