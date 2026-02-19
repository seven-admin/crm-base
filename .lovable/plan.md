

# 3 Variantes de Card: Branco, Transparente e Cinza (#d0d6dd)

## Objetivo

Mostrar 3 estilos de card na pagina, para comparacao visual:

1. **Branco** -- fundo `#FFFFFF` com sombra leve (ja e o estilo do HeroCard e da tabela)
2. **Sem fundo** -- `background: 'transparent'` com sombra leve (ja e o estilo atual do TeamCard e ProjectList)
3. **Cinza (#d0d6dd)** -- substituir o card escuro "Novo Empreendimento" (atualmente `#1E293B`) por fundo `#d0d6dd`

## Mudanca

Apenas o `TestDarkCard.tsx` precisa ser alterado:

- `background: '#1E293B'` vira `background: '#d0d6dd'`
- Cor do titulo: `#FFFFFF` vira `#1E293B` (texto escuro sobre fundo claro)
- Cor do subtexto: `#94A3B8` vira `#475569` (melhor contraste)
- Botao: `background: '#F8FAFC'` pode permanecer branco, ou virar `#FFFFFF` para maior destaque

Os demais cards ja representam as outras 2 variantes (branco e transparente), entao nao precisam de alteracao.

## Arquivo afetado

| Arquivo | Mudanca |
|---|---|
| `src/components/design-test/TestDarkCard.tsx` | Trocar fundo de `#1E293B` para `#d0d6dd`, ajustar cores de texto para escuro |

## Detalhe tecnico

```
background: '#d0d6dd'        (era #1E293B)
titulo color: '#1E293B'      (era #FFFFFF)
subtexto color: '#475569'    (era #94A3B8)
botao: background '#FFFFFF'  (manter claro)
```

