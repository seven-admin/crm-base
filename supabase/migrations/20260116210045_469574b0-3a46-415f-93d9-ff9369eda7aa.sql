-- Adicionar campo beneficiario_id para identificar o gestor/pessoa que receberá o pagamento
ALTER TABLE lancamentos_financeiros 
ADD COLUMN IF NOT EXISTS beneficiario_id UUID REFERENCES auth.users(id);

-- Adicionar campo beneficiario_tipo para diferenciar tipos de beneficiários
ALTER TABLE lancamentos_financeiros 
ADD COLUMN IF NOT EXISTS beneficiario_tipo TEXT CHECK (beneficiario_tipo IN ('gestor', 'corretor', 'imobiliaria', 'fornecedor', 'outro'));

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_lancamentos_beneficiario ON lancamentos_financeiros(beneficiario_id);

-- Comentários
COMMENT ON COLUMN lancamentos_financeiros.beneficiario_id IS 'ID do usuário/entidade beneficiária do lançamento';
COMMENT ON COLUMN lancamentos_financeiros.beneficiario_tipo IS 'Tipo do beneficiário: gestor, corretor, imobiliaria, fornecedor, outro';