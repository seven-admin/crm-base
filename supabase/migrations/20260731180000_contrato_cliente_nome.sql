-- Nome do cliente exibido no contrato quando ele não vem de seven_clientes
-- (ex.: contrato criado a partir de uma proposta da NEXA).
ALTER TABLE nexa_contratos ADD COLUMN IF NOT EXISTS cliente_nome text;
