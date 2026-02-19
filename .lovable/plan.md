
# Trocar indicador de tipologia: de bolinha para linha separadora

## Alteracao no arquivo `src/components/empreendimentos/UnidadesTab.tsx`

### O que muda
Substituir o circulo colorido no canto inferior esquerdo por uma linha horizontal de 2px com a cor da tipologia, posicionada entre o titulo (label da unidade) e a descricao (nome da tipologia e area).

### Detalhes

**Remover** (linha 553-555): o `div` absoluto com a bolinha (`w-2.5 h-2.5 rounded-full`).

**Adicionar** entre o `<span>` do label (linha 535) e o `<span>` da tipologia (linha 537): uma `<div>` com `h-[2px] w-full rounded-full mt-1` usando a cor da tipologia do mapa. So exibir quando a unidade tiver `tipologia_id`.

O card ficara assim visualmente:

```text
  101
 ━━━━━━  (linha colorida 2px)
 2Q Suite
  65m²
```

### Legenda
A legenda de tipologias ja existente continua usando as bolinhas coloridas -- nao sera alterada, pois funciona bem como legenda.

Arquivo alterado: `src/components/empreendimentos/UnidadesTab.tsx`
