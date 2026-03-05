
-- 1. Drop the overly permissive policy
DROP POLICY IF EXISTS "Gestores can manage negociacoes" ON public.negociacoes;

-- 2. Create scoped policies per operation
CREATE POLICY "Gestores can view own negociacoes"
ON public.negociacoes FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'gestor_produto') AND gestor_id = auth.uid());

CREATE POLICY "Gestores can insert own negociacoes"
ON public.negociacoes FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'gestor_produto') AND gestor_id = auth.uid());

CREATE POLICY "Gestores can update own negociacoes"
ON public.negociacoes FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'gestor_produto') AND gestor_id = auth.uid());

CREATE POLICY "Gestores can delete own negociacoes"
ON public.negociacoes FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'gestor_produto') AND gestor_id = auth.uid());
