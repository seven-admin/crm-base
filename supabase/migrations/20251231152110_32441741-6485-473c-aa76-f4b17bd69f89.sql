-- Adicionar colunas de conversão na tabela leads
ALTER TABLE leads ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'ativo';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS convertido_em TIMESTAMPTZ;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS cliente_id UUID REFERENCES clientes(id);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_clientes_lead_id ON clientes(lead_id);

-- Comentário para documentação
COMMENT ON COLUMN leads.status IS 'Status do lead: ativo, convertido, perdido';
COMMENT ON COLUMN leads.convertido_em IS 'Data/hora em que o lead foi convertido para cliente';
COMMENT ON COLUMN leads.cliente_id IS 'Referência ao cliente criado a partir deste lead';