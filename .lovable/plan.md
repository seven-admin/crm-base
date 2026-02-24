

# Exibir VGV a Negociar nos Cards de Empreendimentos

## Objetivo
Mostrar no card de cada empreendimento o valor do VGV que ainda falta ser negociado (vendido).

## Calculo
O dado ja existe no tipo `EmpreendimentoWithStats`:
- `valor_total` = VGV total (soma dos valores de todas as unidades)
- `valor_vendido` = valor das unidades vendidas
- **VGV a negociar** = `valor_total - valor_vendido`

## Alteracao

### Arquivo: `src/components/empreendimentos/EmpreendimentoCard.tsx`

Na secao inferior do card (linhas 187-197), onde atualmente exibe apenas "Valor medio", substituir por dois indicadores:

1. **VGV a Negociar** (lado esquerdo) -- valor total menos valor vendido, formatado compacto
2. Manter o botao "Ver detalhes" (lado direito)

O "Valor medio" sera substituido pelo "VGV a Negociar", que e uma informacao mais util para gestao comercial.

Calculo no componente:
```
const vgvANegociar = empreendimento.valor_total - empreendimento.valor_vendido;
```

Exibicao:
```
VGV a Negociar
R$ 12,5M
```

Usa a funcao `formatCurrency` ja existente no componente com notation compact.

