-- Adicionar campo cargo na tabela profiles para funcionários Seven
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS cargo text;

-- Comentário para documentação
COMMENT ON COLUMN profiles.cargo IS 'Cargo do funcionário Seven (ex: Gestor de Produto, Coordenador, etc.)';