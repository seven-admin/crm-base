

# Correção: Vendas do Mês + Abas no Portal

## Problema do Contador

**Dados reais do BELVEDERE em março:**

| Fonte | O que mostra | Problema |
|-------|-------------|----------|
| Contratos assinados | 0 em março | Contratos são de fev, e "COMPRADOR HISTORICO" |
| Unidades vendida + updated_at | 3 unidades (~R$ 3,4M) | Foram apenas editadas em março, não vendidas agora |
| NEG-00192 (etapa GANHO) | R$ 1.187.957,94 | Unica venda real -- unidade ainda em status "reservada" |

**Causa raiz**: Usar `updated_at` da unidade como proxy de data de venda é incorreto. Qualquer edição muda o `updated_at`.

**Solução correta**: Contar vendas baseado em **negociações que chegaram na etapa GANHO** (`is_final_sucesso = true`). A tabela `funil_etapas` já tem o campo `is_final_sucesso`.

## Plano

### 1. Migration: campo `data_venda` na tabela `unidades`

Adicionar `data_venda timestamptz` para registro preciso, com trigger que só preenche quando status muda para `vendida`. Retroativamente preencher com `updated_at` das já vendidas (melhor aproximação). Isso resolve o problema a longo prazo.

### 2. Alteração no `useDashboardExecutivo.ts`

Adicionar uma **terceira fonte de vendas**: negociações em etapa `is_final_sucesso = true`, agrupadas por mês usando `created_at` ou um campo de data de fechamento. Buscar etapas finais e negociações ganhas com seus valores.

Lógica de vendas do mês:
```
vendasMes = Math.max(
  vendasContratos,           // contratos assinados no mês
  vendasUnidadesDataVenda,   // unidades com data_venda no mês (novo campo)
  vendasNegociacoesGanhas    // negociações GANHO criadas/fechadas no mês
)
```

A query de negociações precisa incluir a etapa do funil para filtrar por `is_final_sucesso`. Isso já é feito parcialmente no hook, mas precisa do join com `funil_etapas`.

### 3. Abas no `PortalIncorporadorPropostas.tsx`

Substituir as 5 `CollapsibleSection` por componente `Tabs` com as abas:

1. **Aguardando Aprovação** -- propostas `em_analise` (com badge count)
2. **Em Preparação** -- propostas `rascunho`/`enviada` com numero_proposta
3. **Atendimentos** -- negociações em etapa `is_inicial = true`
4. **Negociações** -- negociações em etapas não-iniciais
5. **Resolvidas** -- `aprovada_incorporador`/`contra_proposta`

Aba default: "Aguardando Aprovação" se houver items, senão "Atendimentos".

Remover o componente `CollapsibleSection` local e o import de `Collapsible`.

### Detalhes Técnicos

**Migration SQL:**
```sql
ALTER TABLE unidades ADD COLUMN data_venda timestamptz;
UPDATE unidades SET data_venda = updated_at WHERE status = 'vendida';

CREATE OR REPLACE FUNCTION set_data_venda()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status = 'vendida' AND (OLD.status IS DISTINCT FROM 'vendida') THEN
    NEW.data_venda = now();
  ELSIF NEW.status != 'vendida' THEN
    NEW.data_venda = NULL;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_set_data_venda
BEFORE UPDATE ON unidades FOR EACH ROW EXECUTE FUNCTION set_data_venda();
```

**Hook - nova query paralela:**
```typescript
// Buscar negociações ganhas com valor
const negociacoesGanhasQ = supabase
  .from('negociacoes')
  .select('id, valor_negociacao, created_at, funil_etapa_id')
  .eq('is_active', true)
  .in('funil_etapa_id', etapasFinais); // etapas com is_final_sucesso
```

Filtrar por mês e somar `valor_negociacao` como fonte complementar.

**Arquivos alterados:**
- `supabase/migrations/` -- novo migration (data_venda + trigger)
- `src/hooks/useDashboardExecutivo.ts` -- adicionar fonte negociações ganhas + usar data_venda
- `src/pages/portal-incorporador/PortalIncorporadorPropostas.tsx` -- collapsibles para tabs
- `src/integrations/supabase/types.ts` -- atualizado automaticamente

