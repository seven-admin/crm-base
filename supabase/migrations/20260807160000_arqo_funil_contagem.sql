-- Contagem de leads por etapa do funil para o card "Funil comercial" da home.
-- O hook antigo buscava as linhas de arqo_leads e contava no cliente, mas o PostgREST
-- corta a resposta em 1000 linhas — com dezenas de milhares de leads o funil ficava errado.
-- Agregar no servidor retorna ~10 linhas (uma por etapa), sem corte.
-- A home é exclusiva de usuários Seven/super_admin (usuários Arqo vão para a roleta),
-- então a contagem é global — coerente com os demais KPIs da página.
CREATE OR REPLACE FUNCTION public.arqo_funil_contagem()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT coalesce(jsonb_object_agg(etapa_id, qtd), '{}'::jsonb)
  FROM (
    SELECT etapa_id, count(*) AS qtd
    FROM public.arqo_leads
    WHERE is_active AND etapa_id IS NOT NULL
    GROUP BY etapa_id
  ) t;
$function$;

GRANT EXECUTE ON FUNCTION public.arqo_funil_contagem() TO authenticated;
