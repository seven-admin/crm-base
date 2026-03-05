

# Plano: 5 Correções

## 1. Filtro de temperatura em /negociacoes — adicionar "Morto"

**Arquivo**: `src/pages/negociacoes/NegociacoesToolbar.tsx` (linha 20-24)

Adicionar `{ value: 'morto', label: '💀 Morto' }` ao array `TEMPERATURA_OPTIONS`.

## 2. Webhook no cadastro de corretores

Nenhum webhook é disparado ao criar corretores. Adicionar em 3 locais:

- **`src/hooks/useGestorCorretores.ts`** — no `onSuccess` do `createCorretor`, chamar `dispararWebhook('corretor_cadastrado', { id, nome_completo, email, cpf, creci, telefone, imobiliaria_id })`
- **`supabase/functions/create-corretor/index.ts`** — antes do return final, invocar `webhook-dispatcher` via fetch com evento `corretor_cadastrado`
- **`supabase/functions/register-corretor/index.ts`** — antes do return final, invocar `webhook-dispatcher` via fetch com evento `corretor_cadastrado`

## 3. Campo `send_campanha` na tabela corretores

**Migração SQL**:
```sql
ALTER TABLE public.corretores ADD COLUMN IF NOT EXISTS send_campanha varchar(2) DEFAULT NULL;
```

A tabela já possui `cidade` e `uf`. O formulário em `PortalCorretoresGestao.tsx` (`NovoCorretorDialog`) **não tem** campos cidade/uf — adicionar esses campos ao formulário e passá-los no body para `create-corretor`. A edge function `create-corretor` também não recebe esses campos — adicionar `cidade` e `uf` ao destructuring e ao insert.

## 4. Corrigir `useResumoAtendimentos` — filtro de data com overlap

**Arquivo**: `src/hooks/useForecast.ts` (linhas 533-534)

Ainda usa lógica de overlap. Corrigir para:
```typescript
.gte('data_inicio', inicioStr)
.lte('data_inicio', fimStr)
```

## 5. Agenda hooks — manter overlap (correto para calendário)

Os hooks `useAgendaMensal`, `useAgendaDia` e `useAtividadesHoje` usam overlap propositalmente — no contexto de agenda/calendário, uma atividade multi-dia DEVE aparecer em todos os dias que ela abrange. **Não alterar esses hooks.**

## Arquivos afetados

| Arquivo | Alteração |
|---|---|
| `NegociacoesToolbar.tsx` | Adicionar "morto" ao array |
| `useGestorCorretores.ts` | Webhook + campos cidade/uf no body |
| `PortalCorretoresGestao.tsx` | Campos cidade/uf no formulário |
| `create-corretor/index.ts` | Receber cidade/uf + disparar webhook |
| `register-corretor/index.ts` | Disparar webhook |
| `useForecast.ts` | Corrigir overlap no useResumoAtendimentos |
| Migração SQL | Adicionar coluna `send_campanha` |

