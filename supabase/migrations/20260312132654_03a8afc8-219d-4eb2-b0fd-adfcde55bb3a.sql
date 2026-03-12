-- Marcar etapas Atendimento e Proposta completa como visíveis para incorporador
UPDATE public.funil_etapas 
SET visivel_incorporador = true 
WHERE nome IN ('Atendimento', 'Proposta completa') 
  AND visivel_incorporador = false;