
ALTER TABLE metas_comerciais 
ADD COLUMN IF NOT EXISTS periodicidade text NOT NULL DEFAULT 'mensal';

ALTER TABLE metas_comerciais 
DROP CONSTRAINT IF EXISTS metas_comerciais_competencia_empreendimento_id_corretor_id_key;

ALTER TABLE metas_comerciais 
ADD CONSTRAINT metas_comerciais_unique_key 
UNIQUE (competencia, empreendimento_id, corretor_id, periodicidade);
