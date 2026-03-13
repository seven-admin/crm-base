CREATE OR REPLACE FUNCTION public.get_cidades_corretores()
RETURNS TABLE(cidade TEXT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT TRIM(c.cidade) as cidade
  FROM public.corretores c
  WHERE c.cidade IS NOT NULL 
    AND TRIM(c.cidade) <> ''
  ORDER BY cidade;
$$;