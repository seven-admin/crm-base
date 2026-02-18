
# Plano: 8 Melhorias no Portal do Incorporador

## Resumo dos itens

| # | Item | Arquivo(s) principal(is) |
|---|------|--------------------------|
| 1 | Corrigir seleção de data no calendário do forecast (atividades não aparecem) | `AtividadesListaPortal.tsx` |
| 2 | Alimentar funil de temperatura | `FunilTemperatura.tsx` / `useForecast.ts` |
| 3 | Renomear título "Atividades por Tipo" → "Atividades por Tipo Semanal" | `AtividadesPorTipo.tsx` |
| 4 | Adicionar lista de atendimentos na aba dashboard | `PortalIncorporadorForecast.tsx` |
| 5 | Incorporador pode comentar atividades | RLS + verificação no diálogo |
| 6 | Previsões e Negócios (seção "Negociações" com lista) | Novo componente + `PortalIncorporadorForecast.tsx` |
| 7 | Lista de atividades de marketing (exibir para o incorporador) | `PortalIncorporadorMarketing.tsx` |
| 8 | Timeline do planejamento: cabeçalho fixo ao rolar | `PlanejamentoTimeline.tsx` |

---

## Diagnóstico por item

### 1. Calendário não filtra atividades ao clicar na data

**Causa raiz**: Em `AtividadesListaPortal.tsx`, os filtros de data são:
```ts
data_inicio: startOfDay(dataSelecionada).toISOString(),
data_fim: endOfDay(dataSelecionada).toISOString(),
```
Mas a query no hook `useAtividades` usa comparação de strings `yyyy-MM-dd`, enquanto o filtro enviado é um ISO timestamp completo. O hook espera datas no formato `yyyy-MM-dd`, não ISO com hora.

**Correção**: Formatar `dataSelecionada` como `yyyy-MM-dd` antes de passar como filtro, usando `format(dataSelecionada, 'yyyy-MM-dd')`.

### 2. Funil de temperatura vazio

O `useFunilTemperatura` busca clientes que têm atividades com `empreendimento_id` dentro dos IDs do incorporador. A lógica está correta, mas pode retornar zerado se os clientes não têm `temperatura` definida. A exibição no `FunilTemperatura.tsx` mostra a mensagem "Nenhum cliente cadastrado" mas é difícil distinguir se está sem dados ou se os dados não carregam.

**Melhoria**: Adicionar tooltip/label com valor numérico mesmo quando zero, e verificar se o componente `FunilTemperatura` é renderizado corretamente no portal do incorporador (atualmente presente em `PortalIncorporadorForecast.tsx` na seção dashboard).

### 3. Renomear título

Simples alteração de texto em `AtividadesPorTipo.tsx`: "Atividades por Tipo" → "Atividades por Tipo Semanal" (dois pontos onde aparece: no loading e no card real).

### 4. Lista de atendimentos no dashboard

O componente `AtendimentosResumo` já existe e está no dashboard. O pedido é adicionar uma **lista detalhada** de atendimentos (tipo listagem das atividades do tipo `atendimento`). Criar uma seção expansível ou card separado abaixo dos cards de resumo existentes.

### 5. Incorporador pode comentar

A RLS de `atividade_comentarios` já permite `SELECT` e `INSERT` para qualquer usuário autenticado. O `AtividadeDetalheDialog` já inclui `AtividadeComentarios` sem verificação de role. Portanto, os comentários **já deveriam funcionar** quando o incorporador abre o detalhe de uma atividade via `AtividadesListaPortal`. 

Se não funciona é porque o `AtividadeDetalheDialog` faz alguma verificação via `useAuth` para esconder a seção. Verificarei e garantirei que a seção de comentários é visível para o role `incorporador`.

### 6. Previsões e Negócios / Negociações (item "4 Negociações")

Criar uma nova seção no dashboard do forecast do incorporador com:
- KPIs de negociações: total ativo, pendentes de aprovação, aprovadas, rejeitadas
- Lista das negociações dos empreendimentos do incorporador (com cliente, empreendimento, valor, status)

Usar a tabela `negociacoes` filtrada por `empreendimento_id IN empreendimentoIds`.

### 7. Lista de atividades de marketing para o incorporador

A página `PortalIncorporadorMarketing.tsx` já tem KPIs e gráficos mas **não tem lista dos tickets**. Adicionar uma seção de lista detalhada de todos os tickets ativos dos empreendimentos do incorporador, com código, título, categoria, status, prazo.

### 8. Cabeçalho fixo na timeline ao rolar

O `PlanejamentoTimeline.tsx` usa um `ScrollArea` que envolve a área de datas. O header de datas já tem `sticky top-0`, mas o problema é que a coluna lateral esquerda (fases/itens) **não está sticky ao rolar verticalmente** quando há muitos itens — o header desaparece.

A solução é envolver o layout em um contêiner com `overflow-y-auto` de altura fixa, com a coluna lateral e a área de datas tendo ambas o `sticky top-0` no header.

---

## Mudanças técnicas detalhadas

### Arquivo 1: `src/components/portal-incorporador/AtividadesListaPortal.tsx`

```ts
// Antes:
data_inicio: startOfDay(dataSelecionada).toISOString(),
data_fim: endOfDay(dataSelecionada).toISOString(),

// Depois:
data_inicio: format(dataSelecionada, 'yyyy-MM-dd'),
data_fim: format(dataSelecionada, 'yyyy-MM-dd'),
```
Importar `format` do `date-fns`.

### Arquivo 2: `src/components/forecast/AtividadesPorTipo.tsx`

Alterar as duas ocorrências de "Atividades por Tipo" para "Atividades por Tipo Semanal".

### Arquivo 3: `src/pages/portal-incorporador/PortalIncorporadorForecast.tsx`

- Adicionar um novo card/seção "Lista de Atendimentos" na aba dashboard usando filtro `tipo: 'atendimento'` com os IDs dos empreendimentos.
- Adicionar seção "Negociações" com um novo hook `useNegociacoesIncorporador` que consulta `negociacoes` filtradas por `empreendimento_id IN (...)`.

### Arquivo 4: `src/pages/portal-incorporador/PortalIncorporadorMarketing.tsx`

Adicionar lista de todos os tickets (scroll area) após os cards e gráficos existentes, com filtros de status e categoria.

### Arquivo 5: `src/components/planejamento/PlanejamentoTimeline.tsx`

Envolver o conteúdo (coluna lateral + ScrollArea horizontal) em um contêiner com altura máxima e `overflow-y-auto`, garantindo que o header de datas (`.sticky.top-0`) funcione corretamente ao rolar verticalmente.

### Arquivo 6: `src/components/atividades/AtividadeDetalheDialog.tsx`

Verificar se há lógica que esconde comentários para incorporador e remover a restrição se existir.

---

## Novo componente/hook necessário

**`useNegociacoesIncorporador`** (inline em `PortalIncorporadorForecast.tsx` ou em `useForecast.ts`):

```ts
async function fetchNegociacoes(empreendimentoIds: string[]) {
  const { data } = await supabase
    .from('negociacoes')
    .select(`
      id, codigo, status_aprovacao, valor_proposta, created_at,
      cliente:clientes(nome),
      empreendimento:empreendimentos(nome)
    `)
    .in('empreendimento_id', empreendimentoIds)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(50);
  return data || [];
}
```

---

## Ordem de implementação

1. Correção do filtro de calendário (maior impacto, imediato)
2. Renomear título "Atividades por Tipo Semanal"
3. Cabeçalho fixo da timeline
4. Lista de atendimentos no dashboard
5. Seção de Negociações no forecast
6. Lista de tickets de marketing
7. Comentários do incorporador (verificação/ajuste)
8. Funil de temperatura (ajuste visual se necessário)
