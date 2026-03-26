
Objetivo: corrigir definitivamente os contadores de **Atividades** e **Dashboard** em `/portal-incorporador/forecast`, que ainda estão defasados.

Diagnóstico encontrado no código atual
1) **Negociações truncadas por limite**  
`useNegociacoesIncorporador` usa `.limit(50)`, então os KPIs podem ficar menores que o real.

2) **Filtro de data incorreto para timestamp**  
O filtro usa `created_at <= 'yyyy-MM-dd'` (data sem hora), o que pode excluir registros do último dia após 00:00.

3) **KPI classificado por campo errado**  
Os cards usam `status_aprovacao` (pendente/aprovada/rejeitada), mas o fechamento comercial real está em `funil_etapa_id` + `funil_etapas.is_final_sucesso` (ex.: GANHO).  
Resultado: negociação ganha pode aparecer como “pendente”.

4) **Badge da lista de atendimentos pode ficar incorreto**  
A contagem usa `atendimentos.length` da lista limitada (`limit(30)`), não o total real do mês.

5) **Resumo de atividades sensível ao “hoje”**  
`useResumoAtividadesPorCategoria` classifica abertas/futuras/atrasadas com base na data atual, não na competência selecionada, gerando distorção ao navegar entre meses.

Plano de implementação
1) Ajustar origem dos dados de negociações no Forecast
- Em `PortalIncorporadorForecast.tsx`, separar:
  - consulta de **KPIs** (sem limite, período correto);
  - consulta de **lista** (com limite para performance).
- Corrigir janela mensal para timestamp: `>= início do mês` e `< primeiro dia do mês seguinte`.

2) Recalcular KPIs de negociações com regra comercial correta
- Buscar também `funil_etapa_id`, `etapa` e `funil_etapa(nome,is_final_sucesso)`.
- Regras:
  - **Aprovadas** = `is_final_sucesso = true` (ganhas)
  - **Rejeitadas** = etapa final de perda (ex.: LOST/perdido)
  - **Pendentes** = demais negociações ativas no período
- Manter os rótulos atuais dos cards para evitar quebra visual, mas com cálculo correto.

3) Corrigir contador da aba Atividades
- Manter lista limitada (30 itens), porém criar contagem total dedicada para o badge.
- Badge passa a mostrar o total real do período/filtro, não o tamanho da lista paginada.

4) Ajustar resumo por categoria para competência
- Em `useResumoAtividadesPorCategoria.ts`, usar “data de referência da competência”:
  - mês atual: hoje
  - mês passado/futuro: fim do mês selecionado
- Assim abertas/futuras/atrasadas ficam estáveis e coerentes com o mês exibido.

5) Validação final (sem alterar banco)
- Conferir no SQL e na UI os mesmos números para o mesmo filtro de empreendimento/mês.
- Validar:
  - aba Dashboard (negociações)
  - aba Atividades (cards + badge da lista)
  - alternância “todos empreendimentos” vs empreendimento específico.

Arquivos previstos
- `src/pages/portal-incorporador/PortalIncorporadorForecast.tsx`
- `src/hooks/useResumoAtividadesPorCategoria.ts`
- (opcional) extrair hook auxiliar para range mensal e classificação de status de negociação, para evitar regressão.
