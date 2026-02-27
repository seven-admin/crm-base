
# Disponibilidade (Mapa + Lista) e Correção de Propostas no Portal do Incorporador

## Problema 1: Proposta não aparece em /portal-incorporador/propostas

A negociação `NEG-00024` está na etapa "Análise de Proposta" (`ed1b1eb4`), porém seu campo `status_proposta` é NULL. O portal filtra por `status_proposta = 'em_analise'`, então a proposta não aparece.

**Causa raiz**: A correção anterior (setar `status_proposta` ao mover no kanban) só funciona para movimentações futuras. Para negociações já posicionadas na etapa antes da correção, o campo permanece NULL.

**Solução em duas frentes**:

1. **Migration SQL**: Atualizar todas as negociações que estão na etapa "Análise de Proposta" mas com `status_proposta` NULL, setando para `em_analise`:
```sql
UPDATE negociacoes
SET status_proposta = 'em_analise'
WHERE funil_etapa_id = 'ed1b1eb4-2cf1-4cf3-ac62-2a8897a52f35'
  AND (status_proposta IS NULL)
  AND is_active = true;
```

2. **Ajuste no portal**: Além de filtrar por `status_proposta = 'em_analise'`, incluir como fallback negociações que estejam na etapa "Análise de Proposta" mesmo sem status definido. Isso torna o portal mais resiliente:

**Arquivo**: `src/pages/portal-incorporador/PortalIncorporadorPropostas.tsx`
- Alterar o filtro `propostasEmAnalise` para incluir negociações na etapa de análise OU com `status_proposta = 'em_analise'`

---

## Feature 2: Mapa + Lista de Unidades na Disponibilidade

### Arquivo: `src/hooks/useIncorporadorEmpreendimentos.ts`
- Adicionar campo `tipo` na interface `Empreendimento` e no select da query

### Arquivo: `src/pages/portal-incorporador/PortalIncorporadorDisponibilidade.tsx`
Refatorar para exibir mapa e/ou lista de unidades conforme o tipo do empreendimento:

- Se o empreendimento tem tipo `loteamento` ou `condominio`: exibir Tabs com "Mapa" e "Unidades"
- Outros tipos (predio, comercial, etc): exibir apenas lista de unidades
- A lista de unidades usa o hook `useUnidades` existente e exibe tabela readonly com colunas:
  - Quadra/Bloco
  - Unidade (numero)
  - Status (badge colorido)
  - Valor (formatado como moeda)
- Filtro por bloco/quadra (select)
- Badge com contagem de unidades disponíveis
- Usa `ordenarUnidadesPorBlocoENumero` para ordenação consistente

### Detalhes tecnicos

Imports adicionais na pagina de disponibilidade:
- `useUnidades` de `@/hooks/useUnidades`
- `Tabs, TabsContent, TabsList, TabsTrigger` de `@/components/ui/tabs`
- `Table, TableBody, TableCell, TableHead, TableHeader, TableRow` de `@/components/ui/table`
- `Badge` de `@/components/ui/badge`
- `formatarMoeda` de `@/lib/formatters`
- `ordenarUnidadesPorBlocoENumero` de `@/lib/unidadeUtils`

Estrutura da tabela (readonly, sem checkbox — incorporador apenas visualiza):

```text
| Quadra/Bloco | Unidade | Status     | Valor        |
|--------------|---------|------------|--------------|
| Quadra A     | 001     | Disponível | R$ 500.000   |
| Quadra A     | 002     | Reservada  | R$ 500.000   |
```

---

## Arquivos modificados

| Arquivo | Mudanca |
|---------|---------|
| Migration SQL | Corrigir status_proposta das negociacoes existentes na etapa de analise |
| `src/pages/portal-incorporador/PortalIncorporadorPropostas.tsx` | Tornar filtro de propostas mais resiliente |
| `src/hooks/useIncorporadorEmpreendimentos.ts` | Adicionar campo `tipo` |
| `src/pages/portal-incorporador/PortalIncorporadorDisponibilidade.tsx` | Mapa condicional + lista de unidades |

## Resultado esperado
- Proposta NEG-00024 (e outras no mesmo estado) aparece imediatamente no portal do incorporador
- Incorporador pode ver o mapa quando o empreendimento suporta, e/ou a lista completa de unidades
