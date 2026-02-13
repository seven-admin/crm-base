
# Calendario no Planejamento por Empreendimento

## O que muda

Adicionar uma nova aba "Calendario" na visao por empreendimento do Planejamento (`/planejamento`), semelhante ao calendario ja existente na visao global mas alimentado com os itens do empreendimento selecionado.

## Detalhes

### Novo componente: `src/components/planejamento/PlanejamentoCalendarioEmpreendimento.tsx`

- Recebe `empreendimentoId` e `readOnly` como props
- Usa o hook `usePlanejamentoItens` com filtro `{ empreendimento_id }` (ja existente)
- Layout identico ao `PlanejamentoCalendario` da visao global: grid com calendario a esquerda (2/3) e painel de detalhes do dia a direita (1/3)
- Cada dia mostra preview das tarefas com cores por fase (em vez de cores por empreendimento, ja que so ha um empreendimento)
- Painel lateral mostra detalhes das tarefas do dia selecionado com fase, status e badge de atraso
- Navegacao por mes com botoes anterior/proximo e botao "Hoje"

### Alteracao: `src/pages/Planejamento.tsx`

- Importar o novo componente
- Adicionar aba "Calendario" (com icone `Calendar`) entre "Timeline" e "Dashboard" nas tabs do modo por empreendimento
- Renderizar `PlanejamentoCalendarioEmpreendimento` no `TabsContent` correspondente

### Alteracao: `src/pages/portal-incorporador/PortalIncorporadorPlanejamento.tsx`

- Adicionar a mesma aba "Calendario" para consistencia com o portal do incorporador

### Nenhuma alteracao de banco ou hooks

O hook `usePlanejamentoItens` ja retorna todos os dados necessarios (item, fase, status, datas, responsavel).
