-- Adicionar campos para controle de lançamentos recorrentes
ALTER TABLE lancamentos_financeiros
  ADD COLUMN IF NOT EXISTS is_recorrente boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS recorrencia_pai_id uuid REFERENCES lancamentos_financeiros(id),
  ADD COLUMN IF NOT EXISTS recorrencia_frequencia text; -- 'mensal', 'bimestral', 'trimestral', 'semestral', 'anual'

-- Índice para facilitar busca de lançamentos de uma série recorrente
CREATE INDEX IF NOT EXISTS idx_lancamentos_recorrencia_pai ON lancamentos_financeiros(recorrencia_pai_id) WHERE recorrencia_pai_id IS NOT NULL;