-- Integração externa de status de unidades: alteração em lote (atômica), reserva
-- com validade (reserved_until), idempotência, expiração automática e slug público
-- para consulta/PDF sem login. Consumido pelas edge functions unidades-status e
-- unidades-publicas.

-- 1) Validade da reserva na unidade
ALTER TABLE public.seven_unidades
  ADD COLUMN IF NOT EXISTS reserved_until timestamptz;

-- 2) Slug público não-enumerável por empreendimento (para páginas/PDF sem login)
ALTER TABLE public.seven_empreendimentos
  ADD COLUMN IF NOT EXISTS slug_publico text;
UPDATE public.seven_empreendimentos
  SET slug_publico = replace(gen_random_uuid()::text, '-', '')
  WHERE slug_publico IS NULL;
ALTER TABLE public.seven_empreendimentos
  ALTER COLUMN slug_publico SET DEFAULT replace(gen_random_uuid()::text, '-', '');
CREATE UNIQUE INDEX IF NOT EXISTS seven_empreendimentos_slug_publico_key
  ON public.seven_empreendimentos(slug_publico);

-- 3) Idempotência das chamadas externas
CREATE TABLE IF NOT EXISTS public.integracao_idempotencia (
  chave text PRIMARY KEY,
  endpoint text NOT NULL,
  resposta jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.integracao_idempotencia ENABLE ROW LEVEL SECURITY;
-- Sem policies: acesso somente via service_role (edge functions), que ignora RLS.

-- 4) Alteração de status em lote, atômica. status externo aceito:
--    disponivel | reservada | vendida | desistida (desistida -> disponivel).
CREATE OR REPLACE FUNCTION public.set_unidades_status(
  p_status text,
  p_unidade_ids uuid[],
  p_reserved_until timestamptz DEFAULT NULL,
  p_motivo text DEFAULT NULL,
  p_atomico boolean DEFAULT true
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
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

  -- Conflitos: id inexistente/inativo; e (ao reservar) unidade que não está disponível.
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
$$;
REVOKE ALL ON FUNCTION public.set_unidades_status(text, uuid[], timestamptz, text, boolean) FROM PUBLIC;

-- 5) Expiração automática das reservas vencidas (volta para disponivel).
CREATE OR REPLACE FUNCTION public.expire_reservas() RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_count integer;
BEGIN
  WITH upd AS (
    UPDATE public.seven_unidades
    SET status = 'disponivel', reserved_until = NULL, updated_at = now()
    WHERE status = 'reservada' AND reserved_until IS NOT NULL AND reserved_until < now()
    RETURNING id
  )
  SELECT count(*) INTO v_count FROM upd;
  RETURN v_count;
END;
$$;

-- 6) Cron: varre reservas vencidas a cada 15 min.
SELECT cron.unschedule('expira-reservas-unidades')
  WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'expira-reservas-unidades');
SELECT cron.schedule('expira-reservas-unidades', '*/15 * * * *', $$ SELECT public.expire_reservas(); $$);
