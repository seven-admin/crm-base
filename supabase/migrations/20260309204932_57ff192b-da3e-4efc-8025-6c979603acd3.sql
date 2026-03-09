CREATE POLICY "Admins and seven team can delete inscricoes"
ON public.evento_inscricoes
FOR DELETE
TO authenticated
USING (public.is_admin(auth.uid()) OR public.is_seven_team(auth.uid()) OR user_id = auth.uid());