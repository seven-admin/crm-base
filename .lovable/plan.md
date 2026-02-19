

# Melhorar Cards de Unidades na Lista

## Alteracoes no arquivo `src/components/empreendimentos/UnidadesTab.tsx`

### 1. Legendas com espacamento
Na secao de legendas (linha 444), aumentar o gap entre os itens de `gap-4` para `gap-6` para melhor respiro visual.

### 2. Cards mais completos com tipologia
Na funcao `renderUnidadeButton` (linha 460-506), transformar o botao simples em um card mais informativo:
- Aumentar o tamanho do card (de `h-10 min-w-[3.5rem]` para algo como `h-auto min-w-[5rem] p-2`)
- Exibir o numero/label principal em tamanho normal
- Adicionar uma linha pequena abaixo com o nome da tipologia (ex: "2Q Suite") em texto menor (`text-[10px]`)
- Mostrar area privativa se disponivel (ex: "65m2")

### 3. Cor do texto escura
- Trocar `text-white` por `text-gray-800` ou `text-slate-800`
- Ajustar as cores de fundo dos status (`UNIDADE_STATUS_COLORS`) usadas nos cards para tons mais claros/pasteis, ja que o texto sera escuro. Isso sera feito localmente no componente, sem alterar o type global (que e usado em outros lugares como o mapa)
- Usar variantes como `bg-emerald-100`, `bg-yellow-100`, `bg-blue-100`, `bg-purple-100`, `bg-red-100`, `bg-gray-200` para os cards na grid

### 4. Ajustar grid
- Reduzir colunas do grid para acomodar cards maiores (ex: `grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10`)

## Detalhes tecnicos

O `renderUnidadeButton` passara de um botao simples com apenas o label para algo como:

```
[  101  ]
[ 2Q Suite ]
[  65m2  ]
```

Com fundo pastel e texto escuro, mantendo o indicador de status via cor de fundo.

Arquivos alterados:
- `src/components/empreendimentos/UnidadesTab.tsx` (unico arquivo)

