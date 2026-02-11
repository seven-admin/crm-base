
# Analise Completa de Otimizacao - Seven Group CRM

## 1. PROBLEMA CRITICO: N+1 Queries no useEmpreendimentos

**Arquivo:** `src/hooks/useEmpreendimentos.ts` (linhas 39-96)

O hook `useEmpreendimentos` faz uma query para listar empreendimentos e depois executa **2 queries adicionais POR empreendimento** (unidades + capa) dentro de um `Promise.all`. Se houver 20 empreendimentos, sao 40 queries extras.

**Solucao:** Buscar todas as unidades e capas em uma unica query cada, agrupando no lado do cliente.

---

## 2. Dashboard Executivo - Query Monolitica Pesada

**Arquivo:** `src/hooks/useDashboardExecutivo.ts`

O hook faz 12 queries paralelas buscando **todas as linhas** de tabelas como `clientes`, `atividades`, `lancamentos_financeiros`, `unidades`, etc. -- sem filtro de data ou paginacao. Com o crescimento dos dados, isso vai degradar rapidamente.

**Solucao:**
- Criar views materializadas ou funcoes RPC no banco que retornam os KPIs ja agregados
- Ou, no minimo, adicionar filtros de data nas queries (ex: atividades apenas dos ultimos 6 meses)
- Separar em queries menores com staleTime mais longo para dados historicos

---

## 3. Duplicacao de Logica de Normalizacao (upper/lower)

Os hooks `useClientes.ts`, `useAtividades.ts` fazem normalizacao `toUpperCase()` no frontend **E** o banco tem triggers (`uppercase_clientes`, `uppercase_corretores`, etc.) fazendo o mesmo trabalho.

**Solucao:** Remover a normalizacao duplicada no frontend e confiar nos triggers do banco, ou vice-versa. A duplicacao aumenta a complexidade de manutencao.

---

## 4. Invalidacao Excessiva de Cache

Quase toda mutation chama `invalidateDashboards()` que invalida 6+ query keys de uma vez, alem de invalidar queries especificas. Isso causa re-fetches desnecessarios em paginas que o usuario nem esta vendo.

**Solucao:** Usar invalidacao mais granular e/ou `refetchOnMount: true` ao inves de invalidar globalmente. Considerar usar `queryClient.setQueryData` para atualizar dados localmente quando possivel (optimistic updates).

---

## 5. supabase/config.toml sem configuracoes das Edge Functions

O diff mostra que as configuracoes de `verify_jwt = false` foram removidas. Sem essas configuracoes, as edge functions `register-imobiliaria`, `register-corretor`, `delete-imobiliaria`, `create-corretor`, `delete-user` e `webhook-dispatcher` podem parar de funcionar para chamadas nao autenticadas.

**Solucao:** Restaurar as configuracoes de JWT para as edge functions que precisam aceitar chamadas publicas ou de webhooks.

---

## 6. Permissoes - Fetch Sequencial Desnecessario

**Arquivo:** `src/hooks/usePermissions.ts` (linhas 42-56)

O hook faz 3 queries paralelas (modules, roles, user_module_permissions) mas depois faz uma **4a query sequencial** para `role_permissions` que depende do `roleData.id`. Isso adiciona latencia.

**Solucao:** Usar uma funcao RPC que retorne as permissoes completas do usuario em uma unica chamada ao banco.

---

## 7. AuthContext - Safety Timeouts Frageis

**Arquivo:** `src/contexts/AuthContext.tsx` (linhas 89-108)

Existem 3 mecanismos de timeout sobrepostos (100ms setTimeout, 5000ms safety timeout, 10000ms no ProtectedRoute). Isso indica que o fluxo de autenticacao nao e deterministico.

**Solucao:** Simplificar o fluxo usando `getSession()` como fonte unica e carregar dados do usuario de forma sincrona ao resultado.

---

## 8. useNegociacoes usa `supabase as any`

**Arquivo:** `src/hooks/useNegociacoes.ts` (linha 18)

O cast `const db = supabase as any` perde completamente a tipagem TypeScript, impedindo deteccao de erros em tempo de compilacao.

**Solucao:** Regenerar os tipos do Supabase (`supabase gen types typescript`) para incluir as tabelas mais recentes e remover o cast.

---

## 9. Bundle - Fontes Externas Bloqueantes

**Arquivo:** `src/index.css` (linha 1)

O `@import url(...)` do Google Fonts e bloqueante para renderizacao. O navegador para de renderizar ate carregar as fontes.

**Solucao:** Usar `<link rel="preload">` ou `font-display: swap` no `index.html`, ou hospedar as fontes localmente.

---

## 10. Sidebar Recalcula Permissoes em Cada Render

**Arquivo:** `src/components/layout/Sidebar.tsx`

O `filterItems` e chamado em cada render para filtrar 60+ itens de menu. Nao e memoizado.

**Solucao:** Envolver `visibleGroups` em `useMemo` dependendo de `permissions`, `role` e `canAccessModule`.

---

## Resumo de Prioridades

| Prioridade | Item | Impacto |
|------------|------|---------|
| CRITICA | N+1 queries no useEmpreendimentos | Performance/Latencia |
| CRITICA | config.toml sem edge function settings | Funcionalidade quebrada |
| ALTA | Dashboard executivo sem filtros | Performance/Escalabilidade |
| ALTA | Tipos `as any` no useNegociacoes | Seguranca de tipo |
| MEDIA | Invalidacao excessiva de cache | Performance |
| MEDIA | Permissoes com fetch sequencial | Latencia |
| MEDIA | Auth timeouts frageis | Confiabilidade |
| BAIXA | Normalizacao duplicada | Manutencao |
| BAIXA | Fontes bloqueantes | LCP/Core Web Vitals |
| BAIXA | Sidebar sem memoizacao | Re-renders |

---

## Secao Tecnica - Implementacao Sugerida

### Correcao N+1 (useEmpreendimentos)
```typescript
// Ao inves de Promise.all com query por empreendimento:
const empIds = empreendimentos.map(e => e.id);
const [{ data: allUnidades }, { data: allCapas }] = await Promise.all([
  supabase.from('unidades').select('status, valor, empreendimento_id')
    .in('empreendimento_id', empIds).eq('is_active', true),
  supabase.from('empreendimento_midias').select('url, empreendimento_id')
    .in('empreendimento_id', empIds).eq('is_capa', true)
]);
// Agrupar por empreendimento_id no JS
```

### Restaurar config.toml
```toml
project_id = "pizerpoxuqopekmbvohh"

[functions.register-imobiliaria]
verify_jwt = false

[functions.register-corretor]
verify_jwt = false

[functions.create-corretor]
verify_jwt = false

[functions.delete-imobiliaria]
verify_jwt = false

[functions.delete-user]
verify_jwt = false

[functions.webhook-dispatcher]
verify_jwt = false
```
