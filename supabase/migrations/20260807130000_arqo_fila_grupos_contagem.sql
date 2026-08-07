-- Contagem da fila (leads disponíveis para puxar) por grupo do usuário logado.
-- Evita carregar a tabela inteira de leads na roleta: retorna só os números,
-- escalando para milhares de leads na fila.
CREATE OR REPLACE FUNCTION public.arqo_fila_grupos()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT coalesce(jsonb_object_agg(grupo_id, fila), '{}'::jsonb)
  FROM (
    SELECT l.grupo_id,
      count(*) FILTER (
        WHERE l.consultor_id IS NULL
          AND l.fechado_em IS NULL
          AND l.is_active
          AND (l.reserva_ate IS NULL OR l.reserva_ate <= now())
      ) AS fila
    FROM public.arqo_leads l
    WHERE l.grupo_id IN (
      SELECT m.grupo_id FROM public.arqo_grupo_membros m
      WHERE m.user_id = auth.uid() AND m.is_active = true
    )
    GROUP BY l.grupo_id
  ) t;
$function$;

GRANT EXECUTE ON FUNCTION public.arqo_fila_grupos() TO authenticated;
