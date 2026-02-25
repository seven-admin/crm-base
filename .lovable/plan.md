
# Reestruturar Forecast com Abas e Reorganizar Sidebar

## Resumo

Dividir o Forecast em duas abas (Negociacoes e Atividades), mover o Kanban de propostas para o item "Negociacoes" no sidebar, e unificar a listagem de atividades apenas no Diario de Bordo.

---

## 1. Sidebar - Ajustes

**Arquivo:** `src/components/layout/Sidebar.tsx`

| Antes | Depois |
|---|---|
| Negociacoes -> `/atividades?contexto=forecast` | Negociacoes -> `/negociacoes` (Kanban + atividades comerciais) |
| Propostas -> `/negociacoes` | **Remover** (absorvido por Negociacoes) |

O item "Negociacoes" passa a apontar para `/negociacoes` (o Kanban atual). O item "Propostas" e removido pois o Kanban ja estara em "Negociacoes".

---

## 2. Forecast - Duas Abas

**Arquivo:** `src/pages/Forecast.tsx`

Adicionar `Tabs` com duas abas:

### Aba "Negociacoes"
- KPIs Financeiros (valor vendas, comissoes, negociacoes ativas, propostas aceitas) - ja existentes
- Cards por Categoria filtrados para `TIPOS_NEGOCIACAO` (`atendimento`, `assinatura`)
- Usar `useResumoAtividadesPorCategoria` com `tiposFilter = TIPOS_NEGOCIACAO`

### Aba "Atividades"
- Cards por Categoria filtrados para `TIPOS_DIARIO` (ligacao, meeting, reuniao, visita, etc.)
- Usar `useResumoAtividadesPorCategoria` com `tiposFilter = TIPOS_DIARIO`
- Sem KPIs financeiros nesta aba

Os filtros de competencia (mes) e gestor ficam compartilhados acima das abas.

### Mudancas tecnicas
- Adicionar state `tab: 'negociacoes' | 'atividades'` com default `'negociacoes'`
- Duplicar a chamada `useResumoAtividadesPorCategoria` para cada conjunto de tipos
- O botao "Nova Atividade" no header continua funcionando normalmente
- O link "Ver Atividades" aponta para `/atividades` (Diario de Bordo)

---

## 3. Pagina Negociacoes - Simplificar

**Arquivo:** `src/pages/Negociacoes.tsx`

Ja possui abas "Propostas" e "Atividades" (Kanban). Manter como esta, pois o sidebar "Negociacoes" agora aponta diretamente para ca. O titulo pode ser ajustado para "Negociacoes".

---

## 4. Listagem de Atividades - Apenas Diario de Bordo

**Arquivo:** `src/pages/Atividades.tsx`

- Remover a logica de `contexto=forecast` 
- Sempre exibir todos os tipos de atividades (listagem unificada)
- Titulo fixo: "Atividades" / "Gerencie todas as atividades"

---

## Detalhes Tecnicos

### Arquivos a modificar

| Arquivo | Alteracao |
|---|---|
| `src/components/layout/Sidebar.tsx` | Negociacoes aponta para `/negociacoes`, remover item Propostas |
| `src/pages/Forecast.tsx` | Adicionar Tabs (Negociacoes/Atividades) com filtros de tipo diferentes |
| `src/pages/Negociacoes.tsx` | Ajustar titulo para "Negociacoes" |
| `src/pages/Atividades.tsx` | Remover logica de contexto, sempre mostrar todos os tipos |

### Dados no Forecast por aba

```text
Aba Negociacoes:
  - useForecastFinanceiro (KPIs financeiros)
  - useResumoAtividadesPorCategoria(tiposFilter = ['atendimento', 'assinatura'])

Aba Atividades:
  - useResumoAtividadesPorCategoria(tiposFilter = TIPOS_DIARIO)
  - Sem KPIs financeiros
```

### Nenhuma alteracao de banco de dados necessaria
