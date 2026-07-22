DROP POLICY IF EXISTS "Arqo can view lead clientes" ON public.seven_clientes;

CREATE POLICY "Arqo can view lead clientes"
ON public.seven_clientes
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.arqo_leads l
    WHERE l.cliente_id = seven_clientes.id
      AND l.is_active = true
      AND (
        public.is_admin(auth.uid())
        OR public.has_role(auth.uid(), 'arqo_admin')
        OR public.has_role(auth.uid(), 'arqo_gestor')
        OR l.consultor_id = auth.uid()
        OR l.closer_id = auth.uid()
      )
  )
);