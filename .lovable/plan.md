
# Plano: 4 Melhorias no Planejamento e Forecast do Incorporador

## Parte 1 — Planejamento (Portal do Incorporador)

### 1.1 Dashboard como primeira aba

**Arquivo**: `src/pages/portal-incorporador/PortalIncorporadorPlanejamento.tsx`

Trocar a ordem das abas e o `defaultValue`:
- Antes: `activeTab = 'timeline'`, ordem Timeline → Calendário → Dashboard
- Depois: `activeTab = 'dashboard'`, ordem **Dashboard → Timeline → Calendário**

### 1.2 Colapso de fases na Timeline

**Arquivo**: `src/components/planejamento/PlanejamentoTimeline.tsx`

Adicionar estado `collapsedFases: Set<string>` para controlar fases colapsadas.

- Adicionar um botão de toggle (chevron ▶/▼) ao lado do nome de cada fase
- Quando colapsada, a fase exibe apenas a linha do cabeçalho (sem as linhas dos itens)
- Adicionar botão global "Colapsar Tudo / Expandir Tudo" nos controles superiores
- A lógica de colapso se aplica tanto à coluna de nomes (esquerda) quanto à área de barras (direita), mantendo o sincronismo

```tsx
const [collapsedFases, setCollapsedFases] = useState<Set<string>>(new Set());

const toggleFase = (faseId: string) => {
  setCollapsedFases(prev => {
    const next = new Set(prev);
    if (next.has(faseId)) next.delete(faseId);
    else next.add(faseId);
    return next;
  });
};

const collapseAll = () => {
  const allFaseIds = fases?.filter(f => itensByFase.has(f.id)).map(f => f.id) || [];
  setCollapsedFases(new Set(allFaseIds));
};

const expandAll = () => setCollapsedFases(new Set());
```

No header dos controles, adicionar botões:
```tsx
<Button variant="outline" size="sm" onClick={collapseAll}>Colapsar Tudo</Button>
<Button variant="outline" size="sm" onClick={expandAll}>Expandir Tudo</Button>
```

### 1.3 Melhor uso de tela em tela grande

**Arquivo**: `src/components/planejamento/PlanejamentoTimeline.tsx`

- Aumentar o `max-h-[600px]` para `max-h-[calc(100vh-280px)]` para que em telas grandes a timeline ocupe mais espaço vertical
- Aumentar a coluna de tarefas de `200px` para `240px` para comportar nomes mais longos sem truncar tanto

**Arquivo**: `src/components/planejamento/PlanejamentoDashboard.tsx`

Verificar se o dashboard usa bem o espaço horizontal em telas largas — se necessário, ajustar o grid de "Próximos 7 dias" para ocupar colunas side-by-side (`grid-cols-2` com proporções `2fr 1fr`).

---

## Parte 2 — Forecast do Incorporador (Dashboard)

### 2.1 Remover "Lista de Atendimentos" do Dashboard

**Arquivo**: `src/pages/portal-incorporador/PortalIncorporadorForecast.tsx`

Remover o Card "Lista de Atendimentos" (linhas ~247–289) da aba `dashboard`.

### 2.2 Adicionar gráficos de negociações no lugar

No mesmo arquivo, dentro da aba `dashboard`, após os KPIs de negociações, adicionar dois gráficos usando Recharts (já instalado):

**Gráfico 1 — Donut/Pizza: Distribuição de Status**
- Mostra proporção visual de Pendentes / Aprovadas / Rejeitadas
- Componente `PieChart` do Recharts com `Cell` coloridas (amarelo, verde, vermelho)

**Gráfico 2 — Barras: Negociações por Empreendimento**
- Agrupa as negociações por `empreendimento.nome` e mostra contagem
- Componente `BarChart` do Recharts, orientação horizontal para acomodar nomes longos

Ambos os gráficos são construídos a partir dos dados já carregados pelo `useNegociacoesIncorporador`, sem necessidade de nova query.

```tsx
// Dados para gráficos (derivados do array 'negociacoes')
const pieData = [
  { name: 'Pendentes', value: negKPIs.pendentes, color: '#f59e0b' },
  { name: 'Aprovadas', value: negKPIs.aprovadas, color: '#22c55e' },
  { name: 'Rejeitadas', value: negKPIs.rejeitadas, color: '#ef4444' },
].filter(d => d.value > 0);

const barData = negociacoes?.reduce((acc, neg) => {
  const nome = neg.empreendimento?.nome || 'Sem empreendimento';
  const existing = acc.find(a => a.nome === nome);
  if (existing) existing.total++;
  else acc.push({ nome, total: 1 });
  return acc;
}, [] as { nome: string; total: number }[]) || [];
```

Layout dentro do card "Previsões e Negócios":
```
[KPIs 4 boxes]
[Gráfico Donut — col-span-1] | [Gráfico Barras — col-span-2]
[ScrollArea com lista de negociações]
```

---

## Arquivos a modificar

| Arquivo | Mudanças |
|---|---|
| `src/pages/portal-incorporador/PortalIncorporadorPlanejamento.tsx` | Reordenar abas, defaultValue = 'dashboard' |
| `src/components/planejamento/PlanejamentoTimeline.tsx` | Estado de colapso de fases, botões global, max-h maior, coluna 240px |
| `src/pages/portal-incorporador/PortalIncorporadorForecast.tsx` | Remover card Atendimentos do dashboard, adicionar gráficos Recharts |

Nenhum arquivo novo necessário — apenas modificações nos 3 arquivos acima.
