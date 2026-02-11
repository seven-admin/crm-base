-- Add RLS policy for incorporadores to view atividades of their empreendimentos
CREATE POLICY "Incorporadores can view atividades of their empreendimentos"
ON public.atividades
FOR SELECT
TO authenticated
USING (
  public.is_incorporador(auth.uid())
  AND empreendimento_id IN (
    SELECT empreendimento_id 
    FROM public.user_empreendimentos 
    WHERE user_id = auth.uid()
  )
);

-- Add RLS policy for incorporadores to view clientes of gestores linked to their empreendimentos
CREATE POLICY "Incorporadores can view clientes of their gestores"
ON public.clientes
FOR SELECT
TO authenticated
USING (
  public.is_incorporador(auth.uid())
  AND gestor_id IN (
    SELECT ue.user_id 
    FROM public.user_empreendimentos ue
    WHERE ue.empreendimento_id IN (
      SELECT empreendimento_id 
      FROM public.user_empreendimentos 
      WHERE user_id = auth.uid()
    )
  )
);