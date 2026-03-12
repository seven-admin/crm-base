

# Refatoração UX do Portal do Incorporador — Dashboard Principal

## Problema
O layout atual exibe 6 cards de navegação genéricos em grid 4 colunas + 4 KPI cards abaixo, todos com o mesmo estilo visual. Isso cria uma hierarquia plana sem diferenciação visual entre módulos operacionais e informações de resumo. A navegação é igualmente distribuída sem priorizar ações mais frequentes.

## Solução
Reorganizar o dashboard em seções com hierarquia visual clara:

### Layout proposto

```text
┌──────────────────────────────────────────────────────────────┐
│  HEADER (logo + user — mantém)                               │
├──────────────────────────────────────────────────────────────┤
│  "Visão geral dos seus empreendimentos"                      │
│                                                              │
│  ┌─── KPIs (faixa compacta, 4 cols) ──────────────────────┐  │
│  │ Empreendimentos │ Disponíveis │ VGV Vendido │ Vendas   │  │
│  │     2           │    17/19    │   R$ 0      │  R$ 0    │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌─── Módulos (2 cols, cards maiores) ────────────────────┐  │
│  │ ┌─────────────────┐  ┌─────────────────┐              │  │
│  │ │ 📊 Dashboard    │  │ 📈 Forecast     │              │  │
│  │ │ Executivo       │  │ Previsões       │              │  │
│  │ │ KPIs detalhados │  │ e atividades    │              │  │
│  │ └─────────────────┘  └─────────────────┘              │  │
│  │ ┌─────────────────┐  ┌─────────────────┐              │  │
│  │ │ 🗺 Disponib.   │  │ 📋 Propostas    │              │  │
│  │ │ Mapa unidades   │  │ Aprovar/analisar│              │  │
│  │ └─────────────────┘  └─────────────────┘              │  │
│  │ ┌─────────────────┐  ┌─────────────────┐              │  │
│  │ │ 🎨 Marketing   │  │ 📅 Planejamento │              │  │
│  │ │ Tickets         │  │ Cronograma      │              │  │
│  │ └─────────────────┘  └─────────────────┘              │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

### Mudanças de design
1. **KPIs no topo** — mover os 4 KPI cards para acima dos cards de navegação, em formato compacto (sem Card wrapper pesado, apenas uma faixa com valores e labels)
2. **Cards de navegação em 2 colunas** com mais altura — dá mais peso visual e facilita clique em mobile
3. **Separação visual** — KPIs ficam em uma barra com fundo sutil (`bg-muted/30`), módulos abaixo em cards com bordas e hover mais pronunciado
4. **Ordenação por prioridade** — Dashboard Executivo e Forecast primeiro, Disponibilidade e Propostas depois, Marketing e Planejamento por último

### Arquivos alterados
- `src/components/portal-incorporador/PortalIncorporadorLayout.tsx` — reorganizar grid de navegação para 2 colunas, reordenar cards
- `src/pages/portal-incorporador/PortalIncorporadorDashboard.tsx` — redesenhar KPIs em formato compacto inline (faixa horizontal)

