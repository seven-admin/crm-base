
# Padronizar formato dos badges de temperatura no displayMode

## Problema
Na tabela de atividades, o badge "Quente" aparece visivelmente maior que o badge "Frio", apesar de ambos usarem as mesmas classes CSS (`text-[10px] px-1.5 py-0`). A diferenca ocorre porque os emojis (fogo vs floco de neve) renderizam com tamanhos diferentes, inflando o badge de forma inconsistente.

## Solucao

### Arquivo: `src/components/atividades/TemperaturaSelector.tsx`

Adicionar classes de controle de altura e alinhamento ao botao trigger do displayMode (linha 71-82) para garantir formato identico independente do emoji:

- Adicionar `inline-flex items-center h-5 leading-none` ao botao trigger (badge selecionado)
- Aplicar o mesmo padrao aos botoes dentro do PopoverContent (ambos blocos: vazio e com selecao)
- Garantir que todos os botoes de temperatura usem exatamente as mesmas classes de dimensionamento

### Classes padrao para todos os botoes de temperatura no displayMode:
```
'inline-flex items-center h-5 leading-none border rounded-full font-medium transition-colors text-[10px] px-1.5 py-0'
```

### Resultado
Todos os badges (Frio, Morno, Quente) terao exatamente a mesma altura e formato, tanto como trigger quanto como opcoes no popover.
