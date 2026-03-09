

# Alinhar seletor de unidades do PropostaDialog com o padrão do UnidadeSelectorCard

## Problema
O seletor de unidades no `PropostaDialog` usa uma lista simples com checkboxes, enquanto o `UnidadeSelectorCard` (usado na página Nova Proposta) agrupa por bloco com collapsibles e grid visual. O usuário quer consistência.

## Solução
Refatorar a seção de seleção de unidades no `PropostaDialog` para usar o mesmo padrão visual do `UnidadeSelectorCard`:
- Agrupar unidades por bloco usando `groupUnidadesByBloco`
- Usar `Collapsible` com header por bloco e badge de contagem
- Grid de botões clicáveis (toggle) ao invés de checkboxes em lista
- Mostrar andar e valor formatado em cada card
- Manter o botão "Vincular X unidade(s)" existente

## Arquivo a modificar

### `src/components/negociacoes/PropostaDialog.tsx`
- Importar `groupUnidadesByBloco` de `@/lib/mapaUtils`, `Collapsible`/`CollapsibleContent`/`CollapsibleTrigger` de Radix, e `cn` de utils
- Expandir a query de unidades disponíveis para incluir `andar` e `status` (para filtrar apenas disponíveis)
- Substituir o bloco de checkboxes (linhas 341-405) pelo padrão de grid agrupado por bloco:
  - `groupUnidadesByBloco` nos resultados (requer cast para `Unidade` ou adaptação — a query já retorna `numero`, `valor`, `bloco` — basta adicionar os campos mínimos necessários: `andar`, `status`, `empreendimento_id`)
  - `Collapsible` por bloco com `CollapsibleTrigger` mostrando nome do bloco + badge de contagem
  - Grid `grid-cols-2 sm:grid-cols-3` com botões toggle (highlight quando selecionado via `ring-1 ring-primary`)
  - Cada botão mostra número, andar (se houver) e valor formatado
- Recalcular `valorTabela`/`valorProposta` ao toggle de cada unidade (mesma lógica atual)

A query será ajustada para: `id, numero, valor, andar, status, empreendimento_id, bloco:blocos(id, nome)` — campos suficientes para `groupUnidadesByBloco` funcionar (precisa de `bloco?.nome` e `numero`).

