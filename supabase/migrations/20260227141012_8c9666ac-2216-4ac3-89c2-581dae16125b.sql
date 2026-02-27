-- Fix existing negociacoes in "Análise de Proposta" stage with NULL status_proposta
UPDATE negociacoes
SET status_proposta = 'em_analise'
WHERE funil_etapa_id = 'ed1b1eb4-2cf1-4cf3-ac62-2a8897a52f35'
  AND status_proposta IS NULL
  AND is_active = true;