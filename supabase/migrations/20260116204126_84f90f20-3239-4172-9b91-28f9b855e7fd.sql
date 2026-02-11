-- Adicionar coluna gestor_id (referência ao usuário gestor)
ALTER TABLE negociacoes 
ADD COLUMN IF NOT EXISTS gestor_id UUID REFERENCES auth.users(id);

-- Adicionar coluna proposta_origem_id (referência à proposta que originou a negociação)
ALTER TABLE negociacoes 
ADD COLUMN IF NOT EXISTS proposta_origem_id UUID REFERENCES propostas(id);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_negociacoes_gestor_id ON negociacoes(gestor_id);
CREATE INDEX IF NOT EXISTS idx_negociacoes_proposta_origem_id ON negociacoes(proposta_origem_id);

-- Comentários para documentação
COMMENT ON COLUMN negociacoes.gestor_id IS 'ID do gestor responsável pela negociação';
COMMENT ON COLUMN negociacoes.proposta_origem_id IS 'ID da proposta que originou esta negociação (quando convertida)';