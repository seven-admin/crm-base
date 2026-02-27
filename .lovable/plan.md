
# Temperatura vazia com popover no displayMode

## Problema
Quando nao ha temperatura selecionada no `displayMode`, o componente exibe apenas um "-" estatico sem possibilidade de interacao. O usuario nao consegue definir uma temperatura a partir da tabela.

## Solucao

### Arquivo: `src/components/atividades/TemperaturaSelector.tsx`

Alterar o bloco `if (!selected)` (linhas 28-30) para, em vez de retornar um `<span>` simples, retornar o mesmo `Popover` usado quando ha valor selecionado, mas com o "-" como trigger.

O "-" sera um botao clicavel que abre o popover com as 3 opcoes de temperatura, permitindo ao usuario definir uma temperatura diretamente na tabela.

### Mudanca especifica (linhas 28-30)

Substituir:
```tsx
if (!selected) {
  return <span className="text-muted-foreground text-xs">-</span>;
}
```

Por um bloco que envolve o "-" em um `Popover` com as mesmas opcoes de selecao, reutilizando o mesmo `PopoverContent` ja existente abaixo.

### Resultado
- Sem temperatura: exibe "-" clicavel que abre popover com Frio/Morno/Quente
- Com temperatura: comportamento atual mantido (badge clicavel com popover)
