-- 1. Fix INSERT policy: explicitly allow corretor and gestor_imobiliaria roles
DROP POLICY IF EXISTS "Authenticated users can create clientes" ON public.clientes;

CREATE POLICY "Authenticated users can create clientes"
ON public.clientes FOR INSERT TO authenticated
WITH CHECK (
  corretor_id IS NULL
  OR corretor_id IN (
    SELECT c.id FROM public.corretores c
    WHERE c.user_id = auth.uid()
  )
  OR public.is_admin(auth.uid())
  OR public.has_role(auth.uid(), 'gestor_produto')
  OR public.is_gestor_imobiliaria(auth.uid())
  OR public.has_role(auth.uid(), 'corretor')
);

-- 2. Fix SELECT policy for imobiliárias (email → user_id)
DROP POLICY IF EXISTS "Imobiliárias can view linked clientes" ON public.clientes;

CREATE POLICY "Imobiliárias can view linked clientes"
ON public.clientes FOR SELECT TO authenticated
USING (
  imobiliaria_id IN (
    SELECT i.id FROM public.imobiliarias i
    WHERE i.user_id = auth.uid()
  )
);

-- 3. Fix UPDATE policy for imobiliárias (email → user_id)
DROP POLICY IF EXISTS "Imobiliárias can update linked clientes" ON public.clientes;

CREATE POLICY "Imobiliárias can update linked clientes"
ON public.clientes FOR UPDATE TO authenticated
USING (
  imobiliaria_id IN (
    SELECT i.id FROM public.imobiliarias i
    WHERE i.user_id = auth.uid()
  )
);