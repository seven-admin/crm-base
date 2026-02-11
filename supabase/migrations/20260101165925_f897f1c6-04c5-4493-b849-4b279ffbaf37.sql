-- Adicionar coluna briefing_id na tabela projetos_marketing
ALTER TABLE projetos_marketing
ADD COLUMN briefing_id uuid REFERENCES briefings(id);

-- Criar índice para performance
CREATE INDEX idx_projetos_marketing_briefing_id ON projetos_marketing(briefing_id);