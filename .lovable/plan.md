
## Reestruturação Correta das 3 Abas do Forecast do Incorporador

### Mapeamento final das abas

**DASHBOARD** — Negócios e atendimentos  
- Card "Previsões e Negócios": KPIs (Total, Pendentes, Aprovadas, Rejeitadas) + lista de negociações com scroll  
- Card "Lista de Atendimentos": lista paginada de atividades tipo `atendimento`  

**ATIVIDADES** — Análise operacional (sem calendário/lista de detalhes)  
- 4 cards de categoria (Seven, Incorporadora, Imobiliária, Cliente)  
- Lista de Atendimentos logo abaixo dos 4 cards (conforme solicitado)  
- Funil de Temperatura + Visitas por Empreendimento (grid 2 colunas)  
- Atividades por Tipo Semanal + Próximas Atividades (grid 2 colunas)  
- Resumo de Atendimentos e Retornos (`AtendimentosResumo`)  

**CALENDÁRIO** — Detalhamento dia a dia  
- `CalendarioCompacto` na esquerda com seleção de data  
- `AtividadesListaPortal` na direita mostrando atividades do dia clicado  
- Layout em grid (1/3 calendário + 2/3 lista), igual ao layout que estava na aba Atividades antes  

---

### Bug: ProximasAtividades → navega para `/atividades` (rota errada para o incorporador)

**Problema:** O `onClick` em `ProximasAtividades.tsx` chama `navigate('/atividades')`, que é a rota interna do sistema — o incorporador não tem acesso e é redirecionado para o início do portal.

**Correção:** O componente `ProximasAtividades` precisa de uma prop opcional `onAtividadeClick?: (atividadeId: string) => void`. Quando essa prop é fornecida, usa ela em vez de `navigate`. No `PortalIncorporadorForecast`, ao clicar em uma atividade próxima, navegar para a aba **Calendário** com a data da atividade selecionada (ou abrir o detalhe inline).

A solução mais limpa é passar `onAtividadeClick` que seta a `dataSelecionada` para a data daquela atividade e muda para a aba **Calendário** onde o `AtividadesListaPortal` mostrará as atividades do dia.

---

### Arquivos a modificar

**1. `src/components/forecast/ProximasAtividades.tsx`**

Adicionar prop `onAtividadeClick?: (atividadeId: string, dataAtividade: string) => void`:

```tsx
interface ProximasAtividadesProps {
  gestorId?: string;
  empreendimentoIds?: string[];
  onAtividadeClick?: (atividadeId: string, dataAtividade: string) => void;
}
```

No `onClick` de cada atividade, verificar se `onAtividadeClick` existe:
```tsx
onClick={() => {
  if (onAtividadeClick) {
    onAtividadeClick(atividade.id, atividade.data_inicio);
  } else {
    navigate('/atividades');
  }
}}
```

**2. `src/pages/portal-incorporador/PortalIncorporadorForecast.tsx`**

Reestruturar completamente o conteúdo das 3 abas:

```
DASHBOARD:
  └─ Card "Previsões e Negócios"
       ├─ KPIs (4 boxes: Total, Pendentes, Aprovadas, Rejeitadas)
       └─ ScrollArea com lista de negociações
  └─ Card "Lista de Atendimentos"
       └─ ScrollArea com lista de atividades tipo=atendimento

ATIVIDADES:
  └─ Grid 4 cols: CategoriaCard × 4 (Seven, Incorporadora, Imobiliária, Cliente)
  └─ Card "Lista de Atendimentos" (logo abaixo dos 4 cards)
  └─ Grid 2 cols: FunilTemperatura | VisitasPorEmpreendimento
  └─ Grid 2 cols: AtividadesPorTipo | ProximasAtividades (com onAtividadeClick)
  └─ AtendimentosResumo (largura total)

CALENDÁRIO:
  └─ Grid 3 cols:
       ├─ col-1: CalendarioCompacto (com onDayClick → setDataSelecionada)
       └─ col-2: AtividadesListaPortal (com dataSelecionada)
```

Adicionar handler para o clique nas Próximas Atividades:
```tsx
function handleProximaAtividadeClick(atividadeId: string, dataAtividade: string) {
  setDataSelecionada(parseISO(dataAtividade));
  setTab('calendario');
}
```

---

### Resumo das mudanças

| Arquivo | O que muda |
|---|---|
| `ProximasAtividades.tsx` | Adicionar prop `onAtividadeClick` opcional, corrigir navigate para portal |
| `PortalIncorporadorForecast.tsx` | Redistribuir componentes nas 3 abas conforme especificação acima |
