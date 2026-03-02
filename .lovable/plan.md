
# Corrigir alinhamento do "Total" nos CategoriaCards

## Problema

Os cards de categoria no Forecast tem alturas diferentes dependendo da quantidade de tipos de atividade listados. O footer "Total" fica colado ao conteudo, causando desalinhamento visual entre os cards (como visivel na imagem).

## Solucao

Fazer o card ocupar toda a altura disponivel e empurrar o footer "Total" para o fundo, usando flexbox com `flex-1` na area de conteudo.

**Arquivo:** `src/components/forecast/CategoriaCard.tsx`

Mudancas:
1. Adicionar `h-full` ao `Card` para ocupar toda a altura do grid
2. Mudar `CardContent` de `space-y-3` para layout flex vertical (`flex flex-col`) com `h-full`
3. Envolver a lista de tipos em uma `div` com `flex-1` para que ela ocupe o espaco restante e empurre badges + total para baixo
4. Manter badges e footer total no final do card, sem `flex-1`

Resultado: independente de quantos tipos existam, o "Total" ficara sempre alinhado na parte inferior de todos os cards.
