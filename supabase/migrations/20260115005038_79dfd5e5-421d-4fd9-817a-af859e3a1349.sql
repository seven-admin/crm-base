-- Remover política antiga de INSERT em clientes se existir
DROP POLICY IF EXISTS "Corretores can create clientes" ON public.clientes;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON public.clientes;

-- Criar política mais permissiva para INSERT em clientes
-- Permite que usuários autenticados criem clientes, validando que o corretor_id (se informado)
-- está vinculado ao usuário logado
CREATE POLICY "Authenticated users can create clientes" 
ON public.clientes 
FOR INSERT 
TO authenticated
WITH CHECK (
  -- Se não informou corretor_id, permite (será null)
  corretor_id IS NULL
  OR
  -- Se informou corretor_id, valida que pertence ao usuário logado
  corretor_id IN (
    SELECT c.id FROM public.corretores c
    WHERE c.user_id = auth.uid() 
       OR c.email = (SELECT p.email FROM public.profiles p WHERE p.id = auth.uid())
  )
  OR
  -- Ou se o usuário é admin/gestor
  public.is_admin(auth.uid())
  OR public.has_role(auth.uid(), 'gestor_produto')
);