

# Plano: 4 Correções de Visibilidade, Filtro e RLS

## 1. Negociações — Gestores veem negociações de outros gestores

**Causa raiz**: A política RLS `Gestores can manage negociacoes` usa apenas `has_role(auth.uid(), 'gestor_produto')` sem restringir por `gestor_id = auth.uid()`. Isso dá acesso total a todas as negociações para qualquer gestor.

**Solução**: Migração SQL para:
- DROP a política atual `Gestores can manage negociacoes`
- Criar políticas separadas por operação (SELECT, INSERT, UPDATE, DELETE) restringindo `gestor_id = auth.uid()`

```sql
DROP POLICY "Gestores can manage negociacoes" ON public.negociacoes;

CREATE POLICY "Gestores can view own negociacoes"
ON public.negociacoes FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'gestor_produto'::app_role) AND gestor_id = auth.uid());

CREATE POLICY "Gestores can insert own negociacoes"
ON public.negociacoes FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'gestor_produto'::app_role) AND gestor_id = auth.uid());

CREATE POLICY "Gestores can update own negociacoes"
ON public.negociacoes FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'gestor_produto'::app_role) AND gestor_id = auth.uid());

CREATE POLICY "Gestores can delete own negociacoes"
ON public.negociacoes FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'gestor_produto'::app_role) AND gestor_id = auth.uid());
```

## 2. Filtro de temperatura — incluir "morto" em todos os locais

O `TemperaturaSelector` já inclui "morto". O `useFunilTemperatura` já conta "morto". O tipo `ClienteTemperatura` já inclui "morto". Verificar se algum componente de filtro nas páginas de Forecast/Negociações exclui "morto" — na análise, todos os hooks usam o array `['frio', 'morno', 'quente', 'morto']`. Não há exclusão explícita. Possível problema: os dados não contêm registros com temperatura "morto" no período. Nenhuma alteração de código necessária aqui — já está implementado.

## 3. Filtro de datas — usar `data_inicio` da atividade por mês (sem overlap)

**Problema**: Os filtros usam lógica de sobreposição (`data_inicio <= fimMes AND data_fim >= inicioMes`), fazendo atividades que se estendem por vários meses aparecerem em todos eles. O usuário quer que cada atividade apareça apenas no mês de sua `data_inicio`.

**Solução**: Alterar as queries nos hooks de forecast/resumo para filtrar por `data_inicio` BETWEEN inicio e fim do mês, em vez da lógica de overlap.

**Arquivos afetados**:
- `src/hooks/useResumoAtividadesPorCategoria.ts` — trocar `.lte('data_inicio', fimStr).gte('data_fim', inicioStr)` por `.gte('data_inicio', inicioStr).lte('data_inicio', fimStr)`
- `src/hooks/useForecast.ts` — mesma alteração nos hooks: `useResumoAtividades`, `useFunilTemperatura`, `useVisitasPorEmpreendimento`, `useAtividadesPorTipoPorSemana`, `useAtividadesPorCorretor`, `useCalendarioAtividades`
- `src/hooks/useAtividades.ts` (`applyAtividadesFilters`) — trocar de overlap para: `gte('data_inicio', filters.data_inicio)` e `lte('data_inicio', filters.data_fim)`

## 4. DiarioBordo — datas invertidas no componente AtividadesMetricsAndBoard

**Problema** (linhas 229-230): `dataInicioFilter = format(endOfMonth(...))` e `dataFimFilter = format(startOfMonth(...))` — os valores estão invertidos.

**Solução**: Corrigir para:
```typescript
const dataInicioFilter = format(startOfMonth(competencia), 'yyyy-MM-dd');
const dataFimFilter = format(endOfMonth(competencia), 'yyyy-MM-dd');
```

