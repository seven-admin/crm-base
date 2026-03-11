
DROP POLICY IF EXISTS "Users can update own inscricoes" ON public.evento_inscricoes;

CREATE POLICY "Users and admins can update inscricoes"
ON public.evento_inscricoes
FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid()
  OR public.is_admin(auth.uid())
  OR public.is_seven_team(auth.uid())
)
WITH CHECK (
  user_id = auth.uid()
  OR public.is_admin(auth.uid())
  OR public.is_seven_team(auth.uid())
);
