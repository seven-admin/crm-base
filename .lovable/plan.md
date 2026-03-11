

# Bug: Atividade de hoje aparecendo como "vencida" no Forecast

## Causa raiz

Encontrei **duas inconsistências** no cálculo de "hoje" e na lógica de vencimento:

### 1. Timezone UTC vs Local
O hook `useAtividadesVencidas` usa `new Date().toISOString().split('T')[0]` que retorna a data em **UTC**. Se o usuário está no Brasil (UTC-3) e acessa o sistema após 21h, o `toISOString()` já retorna o dia seguinte em UTC. Isso faz com que atividades de "hoje" (pelo horário local) sejam classificadas como vencidas porque `data_fim < amanhã_utc` é verdadeiro.

Os outros hooks (`useForecast`, `useResumoAtividadesPorCategoria`) usam `format(new Date(), 'yyyy-MM-dd')` do date-fns que respeita o timezone local — e estão corretos.

### 2. Inconsistência no campo de referência
- `useResumoAtividadesPorCategoria` usa `deadline_date || data_fim` para determinar atraso
- `useForecast` e `useAtividadesVencidas` usam apenas `data_fim`
- `ForecastBatchStatusDialog` usa apenas `data_fim`

Isso gera discrepância: o card de categoria pode mostrar "atrasada" mas o dialog de batch e os alertas não concordam.

## Correções

### `src/hooks/useAtividades.ts` — `useAtividadesVencidas`
- Trocar `new Date().toISOString().split('T')[0]` por `format(new Date(), 'yyyy-MM-dd')` (importar `format` do date-fns)
- Garante que "hoje" é calculado no timezone local

### `src/hooks/useForecast.ts` — `useResumoAtividades`
- Está correto (já usa `format`), sem alteração

### `src/hooks/useResumoAtividadesPorCategoria.ts`
- Padronizar: usar `data_fim` ao invés de `deadline_date || data_fim` para manter consistência com os outros hooks
- OU: propagar `deadline_date || data_fim` para os outros hooks

### `src/components/forecast/ForecastBatchStatusDialog.tsx`
- A lógica de "abertas" (linha 62: `gte('data_fim', hoje)`) e "atrasadas" (linha 65: `lt('data_fim', hoje)`) está correta em termos de timezone (usa `format`), mas atividades de hoje com `data_fim === hoje` caem em "abertas" (correto). Sem alteração necessária.

## Resumo das edições
1. **`useAtividades.ts`**: Corrigir timezone em `useAtividadesVencidas` — usar `format` do date-fns
2. **`useResumoAtividadesPorCategoria.ts`**: Padronizar para usar apenas `data_fim` (sem `deadline_date`) na lógica de atraso, alinhando com todos os outros hooks

