## Dashboard Inicial (dados mockados)

Substituir o placeholder de `/` (`src/pages/Index.tsx`) por um dashboard estruturado em seções verticais, usando dados mockados em um arquivo isolado para facilitar substituição futura por dados reais.

### Estrutura da página

```text
┌─────────────────────────────────────────────────┐
│ PageHeader: "Visão Geral" + período (mock)      │
├─────────────────────────────────────────────────┤
│ KPIs (grid 4 colunas → 2 em md → 1 em sm)       │
├─────────────────────────────────────────────────┤
│ Funil Arqo (6 etapas, barras horizontais)       │
├─────────────────────────────────────────────────┤
│ Top 5 empreendimentos (tabela)                  │
└─────────────────────────────────────────────────┘
```

### 1. KPIs — faixa superior (4 cards)

Combo geral cobrindo captação, vendas e Nexa:

- **Leads novos no mês** — número + variação vs mês anterior
- **Taxa de conversão** — % lead→venda + mini sparkline
- **VGV em negociação** — R$ formatado + contagem de propostas
- **Vendas no mês** — unidades + ticket médio

Cada card usa o padrão visual dos `KPICard` existentes (`src/components/dashboard/KPICard.tsx`), com ícone à esquerda, valor em destaque e delta colorido (verde/vermelho) à direita.

### 2. Funil Arqo (Leads)

Card único com 6 etapas em barras horizontais empilhadas, largura proporcional ao volume:

`Novo → Qualificado → Reunião → Proposta → Ganho | Perdido`

Cada etapa mostra: nome, contagem absoluta, % de conversão desde a etapa anterior. Ganho em verde, Perdido em vermelho ao final. Um pequeno rodapé com "Conversão total: X%".

### 3. Top 5 empreendimentos

Tabela com colunas: **Empreendimento · Tipo · Leads ativos · Propostas · Vendas no mês · VGV negociado**. Ordenada por VGV negociado desc, limitada a 5 linhas. Usa o mesmo estilo de tabela sutil já aplicado no projeto.

### Dados mockados

Novo arquivo `src/pages/dashboard/mockData.ts` exportando:

- `mockKPIs` — 4 objetos `{ label, value, delta, trend, icon }`
- `mockFunilArqo` — array de 6 etapas `{ etapa, quantidade, cor }`
- `mockTopEmpreendimentos` — 5 objetos com os campos da tabela

Valores plausíveis (ex.: 342 leads novos, conversão 8,4%, VGV R$ 18,2 mi, 7 vendas no mês). Nomes fictícios de empreendimentos (Residencial Aurora, Loteamento Vista Verde, etc.) misturando tipos Vertical, Loteamento e Comercial.

### Arquivos

- **Edit** `src/pages/Index.tsx` — manter os redirects existentes (incorporador / corretor / gestor_imobiliaria) e trocar o placeholder pelo novo dashboard dentro do `MainLayout`.
- **New** `src/pages/dashboard/DashboardHome.tsx` — componente do dashboard.
- **New** `src/pages/dashboard/components/FunilArqoCard.tsx` — barras horizontais do funil.
- **New** `src/pages/dashboard/components/TopEmpreendimentosTable.tsx` — tabela top 5.
- **New** `src/pages/dashboard/mockData.ts` — dados fictícios centralizados.

### Detalhes técnicos

- Reuso de componentes existentes: `MainLayout`, `PageHeader`, `KPICard`, `Card`, `Table` (shadcn). Nenhuma nova dependência.
- Formatação monetária via `formatCurrency` de `src/lib/formatters.ts`.
- Cores seguem tokens semânticos (`--primary`, `--accent`, `--success`, `--destructive`) — nada hardcoded.
- Todo componente marcado internamente com comentário `// TODO: substituir por dados reais` para facilitar migração futura.
- Sem impacto em rotas, permissões ou banco de dados.
