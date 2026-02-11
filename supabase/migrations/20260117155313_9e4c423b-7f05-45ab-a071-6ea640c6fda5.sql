-- =====================================================
-- CORREÇÃO: Permitir soft delete de propostas e contratos por super_admin
-- O problema é que as policies de UPDATE têm WITH CHECK (is_active = true)
-- o que impede setar is_active = false
-- =====================================================

-- 1. PROPOSTAS: Remover a policy problemática e criar uma que permite soft delete
DROP POLICY IF EXISTS "Usuarios podem atualizar propostas ativas" ON public.propostas;

-- Policy para usuários normais: podem atualizar dados MAS não podem soft delete
CREATE POLICY "Usuarios podem atualizar propostas exceto is_active"
ON public.propostas
FOR UPDATE
TO authenticated
USING (is_active = true AND auth.uid() IS NOT NULL)
WITH CHECK (is_active = true);

-- A policy de super admin já existe e permite tudo, mas vamos garantir que não tem WITH CHECK restritivo
DROP POLICY IF EXISTS "Super admin pode atualizar propostas" ON public.propostas;

CREATE POLICY "Super admin pode atualizar propostas"
ON public.propostas
FOR UPDATE
TO authenticated
USING (is_super_admin(auth.uid()))
WITH CHECK (true);  -- Super admin pode setar qualquer valor incluindo is_active = false

-- 2. CONTRATOS: Mesma correção
DROP POLICY IF EXISTS "Admins e gestores podem atualizar contratos ativos" ON public.contratos;

-- Policy para gestores: podem atualizar dados MAS não podem soft delete
CREATE POLICY "Gestores podem atualizar contratos ativos"
ON public.contratos
FOR UPDATE
TO authenticated
USING (is_active = true AND (is_admin(auth.uid()) OR gestor_id = auth.uid()))
WITH CHECK (is_active = true);

-- Policy de super admin para contratos
DROP POLICY IF EXISTS "Super admin pode atualizar contratos" ON public.contratos;

CREATE POLICY "Super admin pode atualizar contratos"
ON public.contratos
FOR UPDATE
TO authenticated
USING (is_super_admin(auth.uid()))
WITH CHECK (true);  -- Super admin pode setar qualquer valor incluindo is_active = false

-- Notificar PostgREST para recarregar schema
NOTIFY pgrst, 'reload schema';