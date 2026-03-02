

# Padronizar tamanho dos badges de temperatura

## Problema

Os badges de temperatura no `displayMode` (listagem) tem tamanhos diferentes porque o `rounded-full` com `px-1.5` se ajusta ao conteudo de cada label ("Frio", "Morno", "Quente", "Morto"), criando inconsistencia visual.

## Solucao

**Arquivo:** `src/components/atividades/TemperaturaSelector.tsx`

Adicionar largura fixa nos badges do displayMode para que todos tenham o mesmo tamanho, independentemente do texto. Aplicar `w-12` (48px) e centralizar o conteudo.

### Pontos de alteracao

1. **Badge selecionado** (linha 89-93): adicionar `w-12` ao className
2. **Badges no popover do estado vazio** (linha 66-68): adicionar `w-12`
3. **Badges no popover do estado selecionado** (linha 116-118): adicionar `w-12`

Isso garante que todos os badges — "Morto", "Frio", "Morno", "Quente" — fiquem com o mesmo diametro circular e alinhados visualmente na tabela.

