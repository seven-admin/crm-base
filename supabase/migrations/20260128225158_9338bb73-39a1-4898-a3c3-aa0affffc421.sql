-- Função para verificar se usuário é incorporador
CREATE OR REPLACE FUNCTION public.is_incorporador(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.user_roles ur
    JOIN public.roles r ON r.id = ur.role_id
    WHERE ur.user_id = _user_id
    AND r.name = 'incorporador'
    AND r.is_active = true
  )
$$;

-- Política para incorporadores visualizarem tickets de seus empreendimentos
CREATE POLICY "Incorporadores can view tickets of their empreendimentos"
ON public.projetos_marketing
FOR SELECT
TO authenticated
USING (
  public.is_incorporador(auth.uid())
  AND empreendimento_id IN (
    SELECT empreendimento_id 
    FROM public.user_empreendimentos 
    WHERE user_id = auth.uid()
  )
);