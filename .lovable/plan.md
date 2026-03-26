
Objetivo
Corrigir os contadores de atividades em `/portal-incorporador/forecast` para refletirem o volume real do mês (incluindo as atividades da gestora Tânia).

Diagnóstico confirmado
- Hoje o `PortalIncorporadorForecast.tsx` chama `useResumoAtividadesPorCategoria(..., TIPOS_FORECAST)`.
- `TIPOS_FORECAST = ['atendimento','fechamento','assinatura']`, então quase todo o volume operacional fica fora dos cards.
- Dados de março (empreendimentos do Cerro) mostram o desvio:
  - Total atividades não canceladas: **198**
  - Com filtro `TIPOS_FORECAST`: **5**
  - Gestora **Tânia Moraes**: **176** no total, mas só **2** em `TIPOS_FORECAST`.

Plano de implementação
1) Ajustar a fonte dos cards de categoria para considerar todas as atividades do período
- Arquivo: `src/pages/portal-incorporador/PortalIncorporadorForecast.tsx`
- Remover o filtro `TIPOS_FORECAST` na chamada de `useResumoAtividadesPorCategoria` (usar `tiposFilter` indefinido), mantendo apenas competência + empreendimento.
- Resultado: os cards do Dashboard e da aba Atividades passam a contar o volume real do mês.

2) Evitar confusão entre “atividades” e “atendimentos”
- No mesmo arquivo, manter a seção “Lista de Atendimentos” com lógica de atendimento (especializada), mas deixar explícito no texto/label que esse bloco é só de atendimentos.
- Assim, cards = total de atividades; lista = subconjunto de atendimentos.

3) Higienização de imports e consistência
- Remover import não utilizado de `TIPOS_FORECAST` em `PortalIncorporadorForecast.tsx`.
- Não há mudança de banco nem de RLS (ajuste 100% frontend).

Validação (pós-implementação)
- Em março/2026 e com “Todos os empreendimentos”, conferir que os cards deixam de mostrar ~5 e passam a refletir o total real (centenas).
- Validar especificamente que o volume da Tânia aparece nos cards (antes oculto pelo filtro de tipos).
- Conferir que a “Lista de Atendimentos” continua coerente com seu próprio badge (subconjunto).
