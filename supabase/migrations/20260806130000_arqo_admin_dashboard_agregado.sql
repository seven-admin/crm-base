-- O dashboard de Gestão Arqo contava leads no cliente a partir de useArqoLeads (limit 500),
-- travando todos os contadores em 500. Esta RPC agrega tudo no servidor e retorna os
-- números exatos, escalando para milhares de leads.
CREATE OR REPLACE FUNCTION public.arqo_admin_dashboard()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_inicio_mes timestamptz := date_trunc('month', now());
  result jsonb;
BEGIN
  IF NOT (public.is_admin(auth.uid())
          OR public.has_role(auth.uid(), 'arqo_admin')
          OR public.has_role(auth.uid(), 'arqo_gestor')) THEN
    RAISE EXCEPTION 'Sem permissão para o dashboard Arqo';
  END IF;

  WITH l AS (
    SELECT le.consultor_id, le.grupo_id, le.etapa_id, le.fechado_em,
           le.reserva_ate, le.updated_at, e.categoria
    FROM arqo_leads le
    LEFT JOIN arqo_funil_etapas e ON e.id = le.etapa_id
    WHERE le.is_active = true
  )
  SELECT jsonb_build_object(
    'kpis', (
      SELECT jsonb_build_object(
        'total_ativos',   count(*) FILTER (WHERE fechado_em IS NULL),
        'sem_consultor',  count(*) FILTER (WHERE fechado_em IS NULL AND consultor_id IS NULL AND (reserva_ate IS NULL OR reserva_ate <= now())),
        'em_atendimento', count(*) FILTER (WHERE fechado_em IS NULL AND consultor_id IS NOT NULL),
        'ganhos_mes',     count(*) FILTER (WHERE categoria = 'ganho' AND fechado_em >= v_inicio_mes),
        'perdidos_mes',   count(*) FILTER (WHERE categoria = 'perda' AND fechado_em >= v_inicio_mes)
      ) FROM l
    ),
    'por_etapa', (
      SELECT coalesce(jsonb_object_agg(etapa_id, total), '{}'::jsonb)
      FROM (
        SELECT etapa_id, count(*) AS total
        FROM l WHERE fechado_em IS NULL AND etapa_id IS NOT NULL
        GROUP BY etapa_id
      ) t
    ),
    'por_grupo', (
      SELECT coalesce(jsonb_object_agg(grupo_id, obj), '{}'::jsonb)
      FROM (
        SELECT grupo_id, jsonb_build_object(
          'fila',     count(*) FILTER (WHERE consultor_id IS NULL AND fechado_em IS NULL AND (reserva_ate IS NULL OR reserva_ate <= now())),
          'em_atend', count(*) FILTER (WHERE consultor_id IS NOT NULL AND fechado_em IS NULL),
          'ganhos',   count(*) FILTER (WHERE categoria = 'ganho'),
          'perdas',   count(*) FILTER (WHERE categoria = 'perda')
        ) AS obj
        FROM l WHERE grupo_id IS NOT NULL GROUP BY grupo_id
      ) t
    ),
    'por_consultor', (
      SELECT coalesce(jsonb_object_agg(consultor_id, obj), '{}'::jsonb)
      FROM (
        SELECT consultor_id, jsonb_build_object(
          'ativo',     count(*) FILTER (WHERE fechado_em IS NULL),
          'atendidos', count(*),
          'ganhos',    count(*) FILTER (WHERE categoria = 'ganho'),
          'perdas',    count(*) FILTER (WHERE categoria = 'perda'),
          'ultimo',    max(updated_at)
        ) AS obj
        FROM l WHERE consultor_id IS NOT NULL GROUP BY consultor_id
      ) t
    )
  ) INTO result;

  RETURN result;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.arqo_admin_dashboard() TO authenticated;
