
# Dividir Forecast em Forecast + Diario de Bordo

## Divisao dos tipos de atividade

**Forecast** (pipeline comercial):
- Atendimento
- Fechamento
- Assinatura
- KPIs financeiros (Vendas, Comissoes, Negociacoes, Propostas)

**Diario de Bordo** (rotina operacional):
- Ligacao/WhatsApp
- Meeting
- Reuniao
- Acompanhamento
- Treinamento
- Visita
- Staff Seven (administrativa)

## O que sera feito

### 1. Criar constantes de agrupamento

No arquivo `src/types/atividades.types.ts`, adicionar duas constantes que definem quais tipos pertencem a cada tela:

```text
TIPOS_FORECAST = ['atendimento', 'fechamento', 'assinatura']
TIPOS_DIARIO   = ['ligacao', 'meeting', 'reuniao', 'acompanhamento', 'treinamento', 'visita', 'administrativa']
```

### 2. Criar hooks filtrados

Criar `src/hooks/useDiarioBordo.ts` com hooks similares aos do Forecast (resumo por categoria, resumo geral), mas filtrando apenas os tipos do Diario de Bordo.

Adaptar os hooks existentes do Forecast (`useResumoAtividadesPorCategoria`, `useResumoAtividades`, `useAtividadesPorTipoPorSemana`) para aceitar um parametro `tiposFilter` opcional, ou criar versoes separadas que filtram por `.in('tipo', TIPOS_FORECAST)` e `.in('tipo', TIPOS_DIARIO)`.

### 3. Criar a pagina Diario de Bordo

Criar `src/pages/DiarioBordo.tsx` como uma pagina independente com a mesma estrutura visual do Forecast atual:
- Header com seletor de competencia e filtro de gestor
- Cards por categoria (Seven, Incorporadora, Imobiliaria, Cliente) -- mostrando apenas atividades dos tipos do Diario
- Grafico "Atividades por Tipo Semanal" -- mostrando apenas os tipos do Diario
- Visitas por Empreendimento (permanece no Diario pois "visita" e tipo do Diario)
- Sem KPIs financeiros (esses ficam apenas no Forecast)
- Botao de nova atividade e acoes em lote (super admin)

### 4. Filtrar o Forecast existente

Alterar `src/pages/Forecast.tsx` para que os cards de categoria e o resumo considerem apenas os tipos do Forecast (`atendimento`, `fechamento`, `assinatura`). Os KPIs financeiros permanecem inalterados.

### 5. Adicionar rota e menu

**`src/App.tsx`**: Adicionar rota `/diario-bordo` apontando para a nova pagina, protegida pelo modulo `forecast`.

**`src/components/layout/Sidebar.tsx`**: No grupo "Forecast", adicionar item "Diario de Bordo" com icone `BookOpen`, path `/diario-bordo`.

O menu ficara:

```text
Forecast
  |-- Dashboard (Forecast)    /forecast
  |-- Diario de Bordo         /diario-bordo
  |-- Atividades              /atividades
  |-- Metas Comerciais        /metas-comerciais
```

## Arquivos afetados

| Arquivo | Acao |
|---|---|
| `src/types/atividades.types.ts` | Adicionar constantes TIPOS_FORECAST e TIPOS_DIARIO |
| `src/hooks/useResumoAtividadesPorCategoria.ts` | Adicionar parametro `tiposFilter` para filtrar por tipo |
| `src/hooks/useForecast.ts` | Adicionar parametro `tiposFilter` nos hooks de resumo e grafico semanal |
| `src/pages/Forecast.tsx` | Passar filtro de tipos do Forecast nos hooks |
| `src/pages/DiarioBordo.tsx` | **Novo** -- pagina do Diario de Bordo |
| `src/App.tsx` | Adicionar rota `/diario-bordo` |
| `src/components/layout/Sidebar.tsx` | Adicionar item no menu |

## Detalhes tecnicos

### Filtro nos hooks

Os hooks `useResumoAtividadesPorCategoria` e `useResumoAtividades` receberao um parametro opcional `tiposFilter?: AtividadeTipo[]`. Quando informado, a query adicionara `.in('tipo', tiposFilter)`. A query key incluira os tipos para cache correto.

### Pagina DiarioBordo

Sera uma copia simplificada do Forecast, sem os KPIs financeiros. Reutilizara os mesmos componentes (`CategoriaCard`, `AtividadesPorTipo`, `VisitasPorEmpreendimento`, `ForecastBatchStatusDialog`). O grafico semanal mostrara todos os 7 tipos do Diario.

### Nenhuma alteracao no banco

Nao ha necessidade de migrations ou alteracoes no banco de dados. A divisao e puramente visual/frontend, filtrando os mesmos dados da tabela `atividades` por tipo.
