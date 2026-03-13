
-- 1. Update get_cidades_corretores to include cities from imobiliarias
CREATE OR REPLACE FUNCTION public.get_cidades_corretores()
RETURNS TABLE(cidade TEXT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT cidade FROM (
    SELECT TRIM(c.cidade) as cidade
    FROM public.corretores c
    WHERE c.cidade IS NOT NULL 
      AND TRIM(c.cidade) <> ''
    UNION
    SELECT TRIM(i.endereco_cidade) as cidade
    FROM public.corretores c
    JOIN public.imobiliarias i ON i.id = c.imobiliaria_id
    WHERE (c.cidade IS NULL OR TRIM(c.cidade) = '')
      AND i.endereco_cidade IS NOT NULL
      AND TRIM(i.endereco_cidade) <> ''
  ) sub
  ORDER BY cidade;
$$;

-- 2. Backfill existing corretores with city/uf from their imobiliaria
UPDATE public.corretores c
SET 
  cidade = UPPER(TRIM(i.endereco_cidade)),
  uf = UPPER(TRIM(i.endereco_uf))
FROM public.imobiliarias i
WHERE c.imobiliaria_id = i.id
  AND (c.cidade IS NULL OR TRIM(c.cidade) = '')
  AND i.endereco_cidade IS NOT NULL
  AND TRIM(i.endereco_cidade) <> '';
