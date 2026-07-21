DROP POLICY IF EXISTS arqo_leads_select ON public.arqo_leads;
CREATE POLICY arqo_leads_select ON public.arqo_leads
FOR SELECT
USING (
  is_admin(auth.uid())
  OR has_role(auth.uid(), 'arqo_admin')
  OR has_role(auth.uid(), 'arqo_gestor')
  OR consultor_id = auth.uid()
  OR closer_id = auth.uid()
  OR (
    grupo_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.arqo_grupo_membros m
      WHERE m.grupo_id = arqo_leads.grupo_id
        AND m.user_id = auth.uid()
        AND m.is_active = true
    )
  )
);