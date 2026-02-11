-- Remover a política antiga de UPDATE
DROP POLICY IF EXISTS "Usuarios autenticados podem atualizar propostas" ON propostas;

-- Criar nova política de UPDATE com WITH CHECK que permite soft delete
CREATE POLICY "Usuarios autenticados podem atualizar propostas" ON propostas
  FOR UPDATE
  TO authenticated
  USING (is_active = true)
  WITH CHECK (true);