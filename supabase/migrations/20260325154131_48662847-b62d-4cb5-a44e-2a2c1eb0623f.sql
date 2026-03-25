-- Função SECURITY DEFINER para verificar acesso às condições de pagamento
-- Bypassa o RLS nested da tabela negociacoes
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

-- Consolidar SELECT policies
DROP POLICY IF EXISTS "Users can view negociacao_condicoes_pagamento" 
  ON negociacao_condicoes_pagamento;
DROP POLICY IF EXISTS "Incorporadores can view negociacao_condicoes_pagamento" 
  ON negociacao_condicoes_pagamento;

CREATE POLICY "Users can view negociacao_condicoes_pagamento"
ON negociacao_condicoes_pagamento FOR SELECT TO authenticated
USING (can_view_negociacao_condicoes(negociacao_id));