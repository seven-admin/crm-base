-- Vincular gestor@seven.com à imobiliária ABBA IMÓVEIS para testes
UPDATE public.imobiliarias 
SET user_id = 'f5bf372f-7940-49d7-befb-717e4e3493ae' 
WHERE id = 'bc7e92d1-78d5-48d5-851d-7c6ad343c293' 
  AND user_id IS NULL;