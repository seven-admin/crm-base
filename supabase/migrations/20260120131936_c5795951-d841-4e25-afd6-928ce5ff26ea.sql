
-- Corrigir gestor_id das 3 atividades para Alinne Spoladore
UPDATE public.atividades 
SET gestor_id = 'bdab0eba-3090-4cae-8c6a-c68665257f53'
WHERE id IN (
  '59b79a37-1870-4893-9a2b-806e839ca6c2',  -- Sergio Cristaldo
  '7da58134-b941-42d1-bd16-fd32a96fbb8d',  -- Agendar apresentação presencial
  '5c1dcedb-5696-4e4f-b45c-5835f88facec'   -- Indicação Edwin (parceria)
);
