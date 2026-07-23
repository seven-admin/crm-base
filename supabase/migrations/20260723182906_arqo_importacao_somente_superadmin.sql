-- A criação direta em lote é o mecanismo usado pela importação CSV.
-- Novos leads indicados durante um atendimento continuam sendo criados pela
-- função dedicada, que valida o consultor e executa como SECURITY DEFINER.
DROP POLICY IF EXISTS arqo_leads_insert ON public.arqo_leads;

CREATE POLICY arqo_leads_insert
ON public.arqo_leads
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role((SELECT auth.uid()), 'super_admin')
);
