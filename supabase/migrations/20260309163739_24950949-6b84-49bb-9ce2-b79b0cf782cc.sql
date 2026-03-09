CREATE POLICY "Authenticated users can view active eventos"
ON public.eventos
FOR SELECT
TO authenticated
USING (is_active = true);