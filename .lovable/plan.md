
# Corrigir Total da Tabela de Blocos

## Problemas identificados

1. **Texto "remontando"**: O resumo de totais (linha 178) esta dentro do `CardContent` com `p-0`, entao fica colado nas bordas sem padding adequado.
2. **Total incorreto**: O calculo do total de unidades cadastradas esta correto no codigo, mas o texto fica sobreposto visualmente por falta de espacamento.

## Mudanca

Arquivo: `src/components/empreendimentos/BlocosTab.tsx`

Ajustar a div do resumo (linha 178) para ter padding lateral e inferior adequado:

- Trocar `mt-4` por `px-4 py-3` para dar espacamento correto dentro do CardContent com `p-0`
- Adicionar uma `border-t` para separar visualmente o resumo da tabela

De:
```
<div className="mt-4 text-sm text-muted-foreground flex items-center gap-2">
```

Para:
```
<div className="px-4 py-3 border-t text-sm text-muted-foreground flex items-center gap-2">
```
