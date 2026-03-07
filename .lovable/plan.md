
Objetivo
- Corrigir definitivamente o desalinhamento visual dos números dos dias no calendário de Planejamento e garantir que nenhuma barra/chip passe por cima do número do dia.

Diagnóstico (com base no código atual + screenshot)
- As barras multi-dia são desenhadas em camada absoluta acima do grid (`absolute inset-0`) e iniciam muito próximas da área do cabeçalho da célula.
- O número do dia não tem uma “faixa protegida” explícita com prioridade de camada.
- Existe botão dentro de botão na célula (estrutura inválida HTML), o que pode causar comportamento/layout inconsistente em alguns navegadores.

Plano de implementação
1) Proteger a área do número do dia com zona fixa e z-index
- Em `src/components/planejamento/PlanejamentoCalendario.tsx`, criar constantes explícitas:
  - `DAY_HEADER_HEIGHT`
  - `CELL_PADDING_TOP`
  - `MULTI_DAY_ZONE_HEIGHT`
  - `BAR_TOP_OFFSET = DAY_HEADER_HEIGHT + CELL_PADDING_TOP + margem`
- Garantir que o número do dia fique em uma faixa fixa no topo da célula (sempre igual em todas as células), com `relative z-20`.

2) Empurrar as barras multi-dia para baixo da faixa do dia
- Recalcular o `topPx` das barras usando a nova `BAR_TOP_OFFSET` (derivada das constantes acima, sem “número mágico” solto).
- Manter a limitação de 2 barras visíveis por célula, mas sempre abaixo do cabeçalho do dia.

3) Padronizar a estrutura interna de cada célula
- Trocar o layout interno para “linhas fixas” (header do dia + zona multi-dia reservada + conteúdo restante), evitando variação vertical entre células com e sem itens.
- Isso elimina o efeito de “alguns dias parecem mais altos/baixos”.

4) Corrigir markup inválido (nested button)
- Substituir o botão de “+” interno por elemento não-button (ex.: `span/div` com `role="button"` e keyboard handlers) ou mover para fora da hierarquia do botão principal.
- Mantém mesma UX, evita inconsistência de render/layout.

5) Validação visual focada
- Validar mês com muitas tarefas multi-dia (caso da imagem) e confirmar:
  - todos os números alinhados na mesma linha visual;
  - nenhuma barra sobrepõe número;
  - `+N mais` continua correto.

Arquivos afetados
- `src/components/planejamento/PlanejamentoCalendario.tsx` (principal e suficiente para este ajuste)

Detalhes técnicos (resumo)
- Ajuste de layout por constantes determinísticas (em vez de offset “aproximado”).
- Hierarquia de camadas:
  - número do dia (topo protegido, z-index maior),
  - barras multi-dia (camada intermediária),
  - fundo/conteúdo restante.
- Remoção de nested interactive element para evitar quebra de DOM/comportamento.
