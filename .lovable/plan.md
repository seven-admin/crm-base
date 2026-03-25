

# Correção: Condições de Pagamento Invisíveis para Incorporador

## Diagnóstico

Confirmado via queries diretas:
- Os dados **estão salvos** no banco (4 condições para NEG-00192, incluindo a parcela de financiamento de R$ 870.179,19)
- O INSERT funciona (policy `WITH CHECK (true)`)
- O SELECT retorna `[]` para o incorporador (todas as queries de condições voltam vazias)
- O usuário `cerro@sevengroup360.com.br` tem role `incorporador` e acesso ao empreendimento BELVEDERE

**Causa raiz**: A policy SELECT de `negociacao_condicoes_pagamento` faz um subquery na tabela `negociacoes`, que por sua vez tem RLS própria. O PostgreSQL avalia o RLS da tabela `negociacoes` dentro do subquery, criando uma avaliação nested que falha silenciosamente para o incorporador.

## Solução

Criar uma função `SECURITY DEFINER` que verifica o acesso à negociação **sem depender do RLS** da tabela `negociacoes`, e usá-la em uma policy única e consolidada.

### Migration SQL

```sql
-- Função SECURITY DEFINER para verificar acesso
CREATE OR REPLACE FUNCTION public.can_view_negociacao_condicoes(_neg_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM negociacoes n
    WHERE n.id = _neg_id
    AND (
      is_admin(auth.uid())
      OR has_role(auth.uid(), 'gestor_produto')
      OR is_seven_team(auth.uid())
      OR n.corretor_id IN (SELECT get_corretor_ids_by_user(auth.uid()))
      OR (is_incorporador(auth.uid()) 
          AND user_has_empreendimento_access(auth.uid(), n.empreendimento_id))
    )
  )
$$;

-- Consolidar todas as SELECT policies em uma única
DROP POLICY IF EXISTS "Users can view negociacao_condicoes_pagamento" 
  ON negociacao_condicoes_pagamento;
DROP POLICY IF EXISTS "Incorporadores can view negociacao_condicoes_pagamento" 
  ON negociacao_condicoes_pagamento;

CREATE POLICY "Users can view negociacao_condicoes_pagamento"
ON negociacao_condicoes_pagamento FOR SELECT TO authenticated
USING (can_view_negociacao_condicoes(negociacao_id));
```

### Sem alterações no código frontend
O hook `useNegociacaoCondicoesPagamento` e os componentes continuam funcionando como estão -- o fix é 100% no banco.

## Resultado esperado
- Incorporador verá as condições de pagamento salvas (incluindo a parcela de financiamento)
- Admins, gestores, corretores e equipe seven continuam com acesso normal
- INSERTs e UPDATEs não são afetados (policies separadas já permissivas)

