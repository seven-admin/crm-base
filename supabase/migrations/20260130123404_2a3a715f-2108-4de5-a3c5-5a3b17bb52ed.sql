-- Restringir INSERT em planejamento_itens apenas para admins
CREATE POLICY "Admins can insert planejamento_itens"
ON public.planejamento_itens FOR INSERT
TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

-- Restringir UPDATE em planejamento_itens apenas para admins
CREATE POLICY "Admins can update planejamento_itens"
ON public.planejamento_itens FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- Restringir DELETE em planejamento_itens apenas para admins
CREATE POLICY "Admins can delete planejamento_itens"
ON public.planejamento_itens FOR DELETE
TO authenticated
USING (public.is_admin(auth.uid()));

-- Restringir INSERT em planejamento_fases apenas para admins
CREATE POLICY "Admins can insert planejamento_fases"
ON public.planejamento_fases FOR INSERT
TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

-- Restringir UPDATE em planejamento_fases apenas para admins
CREATE POLICY "Admins can update planejamento_fases"
ON public.planejamento_fases FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- Restringir DELETE em planejamento_fases apenas para admins
CREATE POLICY "Admins can delete planejamento_fases"
ON public.planejamento_fases FOR DELETE
TO authenticated
USING (public.is_admin(auth.uid()));

-- Restringir INSERT em planejamento_status apenas para admins
CREATE POLICY "Admins can insert planejamento_status"
ON public.planejamento_status FOR INSERT
TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

-- Restringir UPDATE em planejamento_status apenas para admins
CREATE POLICY "Admins can update planejamento_status"
ON public.planejamento_status FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- Restringir DELETE em planejamento_status apenas para admins
CREATE POLICY "Admins can delete planejamento_status"
ON public.planejamento_status FOR DELETE
TO authenticated
USING (public.is_admin(auth.uid()));