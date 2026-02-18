
## Reestruturação das Abas do Forecast do Incorporador

### Situação atual (3 abas → será reorganizado)

| Aba | Conteúdo atual |
|-----|---------------|
| Dashboard | Cards de categoria + Funil + Visitas + Atividades por Tipo + Próximas + Atendimentos + Lista Atendimentos + Negociações |
| Atividades | Calendário + Lista de atividades |

### Nova estrutura (3 abas)

| Aba | Conteúdo novo |
|-----|--------------|
| Dashboard | **Somente negociações**: KPIs (Total, Pendentes, Aprovadas, Rejeitadas) + lista detalhada das negociações |
| Atividades | Calendário compacto lateral + lista de atividades + **todos os detalhes que estavam no dashboard**: Cards de categoria, Funil, Visitas, Atividades por Tipo Semanal, Próximas Atividades, Resumo de Atendimentos, Lista de Atendimentos |
| Calendário | Somente o `CalendarioCompacto` em destaque (tela cheia/centralizado) |

---

### Mudanças técnicas no arquivo único

**`src/pages/portal-incorporador/PortalIncorporadorForecast.tsx`**

1. **Tipo do state de aba**: de `'dashboard' | 'atividades'` para `'dashboard' | 'atividades' | 'calendario'`

2. **Adicionar TabsTrigger** para a nova aba "Calendário" (ícone `CalendarDays`)

3. **Aba Dashboard** — remover tudo exceto a seção de negociações:
   - Manter os KPIs numéricos (Total, Pendentes, Aprovadas, Rejeitadas)
   - Manter a lista de negociações com scroll
   - **Remover**: Cards de categoria, Funil, Visitas, Atividades por Tipo, Próximas, Atendimentos, Lista de Atendimentos

4. **Aba Atividades** — expandir com os detalhes vindos do dashboard:
   - Manter o layout atual (calendário lateral + lista central)
   - Adicionar abaixo da lista: Cards de categoria, Funil, Visitas, Atividades por Tipo Semanal, Próximas Atividades, Resumo de Atendimentos, Lista de Atendimentos

5. **Aba Calendário** (nova) — somente o calendário em destaque:
   - `CalendarioCompacto` centralizado sem a lista ao lado
   - Quando clicar em uma data, navegar automaticamente para a aba Atividades com a data selecionada (ou exibir as atividades do dia embaixo na mesma aba)

### Imports necessários

Adicionar `CalendarDays` ao import do `lucide-react`.

### Nenhum arquivo novo é necessário — apenas reorganização do `PortalIncorporadorForecast.tsx`
