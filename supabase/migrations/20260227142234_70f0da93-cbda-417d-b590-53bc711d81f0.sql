-- Garantir idempotência
DROP POLICY IF EXISTS "Incorporadores can view negociacoes from linked empreendimentos" ON public.negociacoes;
DROP POLICY IF EXISTS "Incorporadores can view negociacao_unidades from linked empreendimentos" ON public.negociacao_unidades;

-- SELECT de negociações para incorporador com vínculo ao empreendimento
CREATE POLICY "Incorporadores can view negociacoes from linked empreendimentos"
ON public.negociacoes
FOR SELECT
TO authenticated
USING (
  public.is_incorporador(auth.uid())
  AND public.user_has_empreendimento_access(auth.uid(), empreendimento_id)
);

-- SELECT de itens da negociação quando a negociação for acessível ao incorporador
CREATE POLICY "Incorporadores can view negociacao_unidades from linked empreendimentos"
ON public.negociacao_unidades
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.negociacoes n
    WHERE n.id = negociacao_unidades.negociacao_id
      AND public.is_incorporador(auth.uid())
      AND public.user_has_empreendimento_access(auth.uid(), n.empreendimento_id)
  )
);