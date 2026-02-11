-- Adicionar coluna is_interno para tickets de marketing
ALTER TABLE projetos_marketing 
ADD COLUMN is_interno BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN projetos_marketing.is_interno IS 'Indica se o ticket é para uso interno da empresa';