
-- Policy 1: Incorporador pode ver clientes vinculados a negociações dos seus empreendimentos
DROP POLICY IF EXISTS "Incorporadores can view clientes from negociacoes" ON public.clientes;
CREATE POLICY "Incorporadores can view clientes from negociacoes"
ON public.clientes FOR SELECT TO authenticated
USING (
  public.is_incorporador(auth.uid())
  AND id IN (
    SELECT n.cliente_id FROM public.negociacoes n
    WHERE public.user_has_empreendimento_access(auth.uid(), n.empreendimento_id)
  )
);

-- Policy 2: Incorporador pode ver condições de pagamento das negociações acessíveis
DROP POLICY IF EXISTS "Incorporadores can view negociacao_condicoes_pagamento" ON public.negociacao_condicoes_pagamento;
CREATE POLICY "Incorporadores can view negociacao_condicoes_pagamento"
ON public.negociacao_condicoes_pagamento FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.negociacoes n
    WHERE n.id = negociacao_condicoes_pagamento.negociacao_id
      AND public.is_incorporador(auth.uid())
      AND public.user_has_empreendimento_access(auth.uid(), n.empreendimento_id)
  )
);
