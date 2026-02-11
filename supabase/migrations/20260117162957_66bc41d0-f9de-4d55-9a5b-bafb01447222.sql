-- 1. Remover a política problemática que bloqueia soft delete
DROP POLICY IF EXISTS "Usuarios podem atualizar propostas exceto is_active" ON public.propostas;

-- 2. Criar política de UPDATE para campos gerais (mantém is_active = true)
CREATE POLICY "Usuarios podem atualizar campos de propostas"
ON public.propostas
FOR UPDATE
TO authenticated
USING (is_active = true AND auth.uid() IS NOT NULL)
WITH CHECK (is_active = true);

-- 3. Criar política específica para soft delete (admins e gestores)
CREATE POLICY "Admins e gestores podem excluir propostas"
ON public.propostas
FOR UPDATE
TO authenticated
USING (
  is_active = true 
  AND (
    public.is_super_admin(auth.uid()) 
    OR public.is_admin(auth.uid())
    OR gestor_id = auth.uid()
  )
)
WITH CHECK (true);