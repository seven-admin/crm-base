-- Remover a política antiga de UPDATE
DROP POLICY IF EXISTS "Usuarios autenticados podem atualizar propostas" ON public.propostas;
DROP POLICY IF EXISTS "Usuarios logados podem atualizar propostas" ON public.propostas;

-- Criar nova política de UPDATE com padrão TO public + auth.uid() IS NOT NULL
-- Esse padrão é mais robusto e evita problemas de role/claim
CREATE POLICY "Usuarios logados podem atualizar propostas"
  ON public.propostas
  FOR UPDATE
  TO public
  USING (auth.uid() IS NOT NULL AND is_active = true)
  WITH CHECK (auth.uid() IS NOT NULL);