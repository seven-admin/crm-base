
-- Adicionar política INSERT direta para gestor_produto
-- (sem depender de gestor_id ou corretor_id)
CREATE POLICY "Gestores produto can insert clientes direto"
  ON public.clientes
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'gestor_produto'));
