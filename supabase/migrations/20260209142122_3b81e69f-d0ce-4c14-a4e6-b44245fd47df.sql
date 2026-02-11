ALTER TABLE lancamentos_financeiros
  DROP CONSTRAINT lancamentos_financeiros_beneficiario_id_fkey;

ALTER TABLE lancamentos_financeiros
  ADD CONSTRAINT lancamentos_financeiros_beneficiario_id_fkey
  FOREIGN KEY (beneficiario_id) REFERENCES profiles(id);