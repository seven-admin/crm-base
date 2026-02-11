-- Adicionar negociacao_id e modalidade_id em contratos
ALTER TABLE contratos ADD COLUMN IF NOT EXISTS negociacao_id uuid REFERENCES negociacoes(id);
ALTER TABLE contratos ADD COLUMN IF NOT EXISTS modalidade_id uuid REFERENCES modalidades_pagamento(id);

-- Adicionar modalidade_id em negociacoes
ALTER TABLE negociacoes ADD COLUMN IF NOT EXISTS modalidade_id uuid REFERENCES modalidades_pagamento(id);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_contratos_negociacao ON contratos(negociacao_id);
CREATE INDEX IF NOT EXISTS idx_contratos_modalidade ON contratos(modalidade_id);
CREATE INDEX IF NOT EXISTS idx_negociacoes_modalidade ON negociacoes(modalidade_id);