-- Corrigir políticas RLS para exclusão (soft delete) de contratos e propostas
-- Apenas super_admin pode fazer soft delete (is_active = false)

-- ============================================
-- CONTRATOS
-- ============================================

-- Remover políticas de UPDATE existentes que podem conflitar
DROP POLICY IF EXISTS "Super admin pode desativar contratos" ON contratos;
DROP POLICY IF EXISTS "Usuarios logados podem atualizar contratos" ON contratos;

-- Política para super admin fazer qualquer UPDATE (incluindo soft delete)
CREATE POLICY "Super admin pode atualizar contratos"
  ON contratos
  FOR UPDATE
  TO authenticated
  USING (is_super_admin(auth.uid()))
  WITH CHECK (is_super_admin(auth.uid()));

-- Política para admins/gestores fazerem UPDATE normal (mas não podem mudar is_active para false)
CREATE POLICY "Admins e gestores podem atualizar contratos ativos"
  ON contratos
  FOR UPDATE
  TO authenticated
  USING (
    is_active = true 
    AND (
      is_admin(auth.uid()) 
      OR gestor_id = auth.uid()
    )
  )
  WITH CHECK (
    is_active = true -- Impede que não-super-admins desativem
  );

-- ============================================
-- PROPOSTAS
-- ============================================

-- Remover políticas de UPDATE existentes que podem conflitar
DROP POLICY IF EXISTS "Super admin pode desativar propostas" ON propostas;
DROP POLICY IF EXISTS "Usuarios logados podem atualizar propostas" ON propostas;

-- Política para super admin fazer qualquer UPDATE (incluindo soft delete)
CREATE POLICY "Super admin pode atualizar propostas"
  ON propostas
  FOR UPDATE
  TO authenticated
  USING (is_super_admin(auth.uid()))
  WITH CHECK (is_super_admin(auth.uid()));

-- Política para usuários autenticados fazerem UPDATE normal (mas não podem mudar is_active para false)
CREATE POLICY "Usuarios podem atualizar propostas ativas"
  ON propostas
  FOR UPDATE
  TO authenticated
  USING (
    is_active = true
    AND auth.uid() IS NOT NULL
  )
  WITH CHECK (
    is_active = true -- Impede que não-super-admins desativem
  );