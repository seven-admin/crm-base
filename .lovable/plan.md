
# Cards Segmentados por Categoria no Forecast

## O que sera feito

Substituir os 6 KPI cards atuais (Pendentes, Hoje, Concluidas, etc.) por **4 cards de categoria** (Seven, Incorporadora, Imobiliaria, Cliente). Cada card mostrara os contadores por tipo de atividade dentro daquela categoria.

## Layout dos Cards

```text
+---------------------+  +---------------------+  +---------------------+  +---------------------+
| SEVEN               |  | INCORPORADORA       |  | IMOBILIARIA         |  | CLIENTE             |
|                     |  |                     |  |                     |  |                     |
| Visita ......... 5  |  | Treinamento ..... 5 |  | Atendimento ..... 1 |  | Visita ........ 111 |
| Reuniao ........ 1  |  | Atendimento ..... 1 |  | Treinamento ..... 5 |  | Ligacao ........ 79 |
| Administrativa . 1  |  |                     |  |                     |  | Atendimento .... 75 |
|                     |  |                     |  |                     |  | Reuniao ........ 52 |
| Total: 7            |  | Total: 6            |  | Total: 6            |  | Total: 317          |
+---------------------+  +---------------------+  +---------------------+  +---------------------+
```

Cada card tera:
- Icone e nome da categoria no topo
- Lista de tipos de atividade com contadores (apenas os que existem)
- Total no rodape

## Mudancas

### 1. Novo hook: `useResumoAtividadesPorCategoria` (em `src/hooks/useForecast.ts`)

Busca atividades no periodo selecionado e agrupa por `categoria` e `tipo`, retornando um objeto com a estrutura:

```typescript
{
  seven: { visita: 5, reuniao: 1, administrativa: 1, total: 7 },
  incorporadora: { treinamento: 5, atendimento: 1, total: 6 },
  imobiliaria: { ... },
  cliente: { visita: 111, ligacao: 79, ... }
}
```

Aceita os mesmos filtros (gestorId, dataInicio, dataFim, empreendimentoIds).

### 2. Novo componente: `CategoriaCard` (em `src/components/forecast/CategoriaCard.tsx`)

Componente reutilizavel que recebe:
- nome da categoria
- icone
- dados (contadores por tipo)
- cor de destaque

Renderiza um Card compacto com a lista de tipos e seus contadores.

### 3. Atualizar `src/pages/Forecast.tsx`

- Importar o novo hook e componente
- Substituir a grid de 6 KPICardCompact por uma grid de 4 CategoriaCards
- Manter os filtros de gestor e periodo existentes funcionando
- Atualizar tambem o modo TV para usar os novos cards

### 4. Atualizar `src/pages/portal-incorporador/PortalIncorporadorForecast.tsx`

- Substituir os 4 KPI cards genericos pelos mesmos CategoriaCards segmentados

## Secao Tecnica

- A query busca `categoria, tipo, status` das atividades no periodo e agrupa client-side
- Atividades sem categoria (`null`) serao ignoradas nos cards
- Os labels de tipo usam `ATIVIDADE_TIPO_LABELS` ja existente em `src/types/atividades.types.ts`
- Os labels de categoria usam `ATIVIDADE_CATEGORIA_LABELS` ja existente
- Grid: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`
- Aproximadamente 3 arquivos criados/alterados
