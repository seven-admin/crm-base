-- Add complete fields to leads table for contract requirements
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS cpf TEXT,
ADD COLUMN IF NOT EXISTS rg TEXT,
ADD COLUMN IF NOT EXISTS nacionalidade TEXT,
ADD COLUMN IF NOT EXISTS estado_civil TEXT,
ADD COLUMN IF NOT EXISTS profissao TEXT,
ADD COLUMN IF NOT EXISTS nome_mae TEXT,
ADD COLUMN IF NOT EXISTS nome_pai TEXT,
ADD COLUMN IF NOT EXISTS data_nascimento DATE,
ADD COLUMN IF NOT EXISTS endereco_logradouro TEXT,
ADD COLUMN IF NOT EXISTS endereco_numero TEXT,
ADD COLUMN IF NOT EXISTS endereco_complemento TEXT,
ADD COLUMN IF NOT EXISTS endereco_bairro TEXT,
ADD COLUMN IF NOT EXISTS endereco_cidade TEXT,
ADD COLUMN IF NOT EXISTS endereco_uf TEXT,
ADD COLUMN IF NOT EXISTS endereco_cep TEXT;