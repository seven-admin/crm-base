-- Integração NEXA: set_unidades_status passa a aceitar p_observacoes (opcional) e
-- gravar em seven_unidades.observacoes. NULL/ausente mantém o valor atual (não
-- sobrescreve edição manual); string (inclusive '') sobrescreve.
DROP FUNCTION IF EXISTS public.set_unidades_status(text, uuid[], timestamptz, text, boolean);

CREATE OR REPLACE FUNCTION public.set_unidades_status(
  p_status text,
  p_unidade_ids uuid[],
  p_reserved_until timestamptz DEFAULT NULL,
  p_motivo text DEFAULT NULL,
  p_atomico boolean DEFAULT true,
  p_observacoes text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_status public.unidade_status;
  v_reserved timestamptz;
  v_conflitos jsonb;
  v_atualizadas jsonb;
BEGIN
  IF p_status = 'desistida' THEN
    v_status := 'disponivel';
  ELSIF p_status IN ('disponivel','reservada','vendida') THEN
    v_status := p_status::public.unidade_status;
  ELSE
    RAISE EXCEPTION 'Status inválido: %', p_status;
  END IF;

  v_reserved := CASE WHEN v_status = 'reservada'
                     THEN COALESCE(p_reserved_until, now() + interval '24 hours')
                     ELSE NULL END;

  SELECT COALESCE(jsonb_agg(c), '[]'::jsonb) INTO v_conflitos FROM (
    SELECT jsonb_build_object('id', x, 'motivo', 'nao_encontrada') AS c
    FROM unnest(p_unidade_ids) x
    WHERE NOT EXISTS (SELECT 1 FROM public.seven_unidades u WHERE u.id = x AND u.is_active)
    UNION ALL
    SELECT jsonb_build_object('id', u.id, 'motivo', 'indisponivel', 'status_atual', u.status)
    FROM public.seven_unidades u
    WHERE u.id = ANY(p_unidade_ids) AND u.is_active
      AND v_status = 'reservada' AND u.status <> 'disponivel'
  ) t;

  IF p_atomico AND jsonb_array_length(v_conflitos) > 0 THEN
    RETURN jsonb_build_object('ok', false, 'conflitos', v_conflitos);
  END IF;

  WITH upd AS (
    UPDATE public.seven_unidades u
    SET status = v_status,
        reserved_until = v_reserved,
        observacoes = COALESCE(p_observacoes, u.observacoes),
        updated_at = now()
    WHERE u.id = ANY(p_unidade_ids) AND u.is_active
      AND (v_status <> 'reservada' OR u.status = 'disponivel')
    RETURNING u.id
  )
  SELECT COALESCE(jsonb_agg(jsonb_build_object('id', id, 'status', v_status, 'reserved_until', v_reserved)), '[]'::jsonb)
  INTO v_atualizadas FROM upd;

  RETURN jsonb_build_object(
    'ok', true,
    'status_aplicado', v_status,
    'reserved_until', v_reserved,
    'atualizadas', v_atualizadas,
    'ignoradas', v_conflitos,
    'motivo', p_motivo
  );
END;
$function$;
