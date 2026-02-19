-- Clean up inactive units that are NOT referenced by contracts
DELETE FROM unidades 
WHERE is_active = false 
  AND id NOT IN (SELECT unidade_id FROM contrato_unidades);