-- Política para profiles: supervisores de marketing podem ver profiles da equipe
CREATE POLICY "Marketing supervisors can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.is_marketing_supervisor(auth.uid()));

-- Política para user_roles: supervisores de marketing podem ver roles da equipe
CREATE POLICY "Marketing supervisors can view all user_roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.is_marketing_supervisor(auth.uid()));