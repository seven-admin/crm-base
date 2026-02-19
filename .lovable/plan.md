
# Identificador Visual de Tipologia nos Cards

## Objetivo
Adicionar um indicador colorido em cada card de unidade para identificar visualmente unidades com a mesma tipologia. Cada tipologia recebe uma cor unica automaticamente.

## Como vai funcionar
- Uma pequena bolinha colorida aparece no canto inferior esquerdo de cada card
- Tipologias diferentes recebem cores diferentes de uma paleta predefinida
- Cards sem tipologia nao exibem a bolinha
- A legenda das tipologias e exibida abaixo da legenda de status existente

## Alteracao no arquivo `src/components/empreendimentos/UnidadesTab.tsx`

### 1. Paleta de cores para tipologias
Criar uma paleta fixa de cores (8-10 cores distintas) que sera atribuida automaticamente a cada tipologia do empreendimento com base no indice:

```
const TIPOLOGIA_COLORS = [
  'bg-indigo-400', 'bg-pink-400', 'bg-teal-400',
  'bg-orange-400', 'bg-cyan-400', 'bg-rose-400',
  'bg-lime-400', 'bg-violet-400', 'bg-amber-400', 'bg-sky-400'
];
```

### 2. Mapa tipologia -> cor
Construir um Map que associa cada `tipologia_id` a uma cor da paleta, baseado na lista de tipologias ja carregada pelo componente.

### 3. Bolinha no card
Dentro do `renderUnidadeButton`, adicionar uma bolinha (`w-2.5 h-2.5 rounded-full`) no canto inferior esquerdo do card, com a cor correspondente a tipologia da unidade.

### 4. Legenda de tipologias
Adicionar uma segunda linha de legenda (abaixo da legenda de status) mostrando cada tipologia com sua bolinha colorida e o nome, para que o usuario saiba o que cada cor representa.
