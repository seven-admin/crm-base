ALTER TABLE lancamentos_financeiros 
  DROP CONSTRAINT lancamentos_financeiros_recorrencia_pai_id_fkey,
  ADD CONSTRAINT lancamentos_financeiros_recorrencia_pai_id_fkey 
    FOREIGN KEY (recorrencia_pai_id) REFERENCES lancamentos_financeiros(id) ON DELETE SET NULL;