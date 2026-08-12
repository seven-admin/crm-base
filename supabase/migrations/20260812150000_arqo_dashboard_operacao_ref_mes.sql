-- Home comercial navegável por mês de referência: os RPCs passam a aceitar p_ref (data
-- dentro do mês desejado) e escopam produção + carteira + ranking à janela [mês, mês+1).

DROP FUNCTION IF EXISTS public.arqo_dashboard_operacao();
DROP FUNCTION IF EXISTS public.arqo_top_consultores(int);

CREATE OR REPLACE FUNCTION public.arqo_dashboard_operacao(p_ref date DEFAULT current_date)
RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH w AS (
    SELECT date_trunc('month', p_ref::timestamptz) AS lo,
           date_trunc('month', p_ref::timestamptz) + interval '1 month' AS hi
  )
  SELECT jsonb_build_object(
    'producao', jsonb_build_object(
      'prospeccao',  (SELECT count(*) FROM public.arqo_leads l, w WHERE l.created_at >= w.lo AND l.created_at < w.hi),
      'agendamento', (SELECT count(*) FROM public.arqo_agendamentos a, w WHERE a.created_at >= w.lo AND a.created_at < w.hi AND a.status <> 'cancelado'),
      'atendimento', (SELECT count(*) FROM public.arqo_atendimentos t, w WHERE t.encerrado_em >= w.lo AND t.encerrado_em < w.hi)
    ),
    'carteira', (
      SELECT jsonb_build_object(
        'proposta_qtd', COALESCE(count(*) FILTER (WHERE e.nome = 'Proposta'), 0),
        'assinado_qtd', COALESCE(count(*) FILTER (WHERE e.categoria = 'ganho'), 0),
        'vgv',          COALESCE(sum(l.valor_estimado) FILTER (WHERE e.nome = 'Proposta' OR e.categoria = 'ganho'), 0)
      )
      FROM public.arqo_leads l
      JOIN public.arqo_funil_etapas e ON e.id = l.etapa_id, w
      WHERE l.is_active = true AND l.created_at >= w.lo AND l.created_at < w.hi
    )
  );
$$;

CREATE OR REPLACE FUNCTION public.arqo_top_consultores(p_limit int DEFAULT 7, p_ref date DEFAULT current_date)
RETURNS TABLE(consultor_id uuid, nome text, visitas int, qtd_leads int, vgv numeric)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH w AS (
    SELECT date_trunc('month', p_ref::timestamptz) AS lo,
           date_trunc('month', p_ref::timestamptz) + interval '1 month' AS hi
  ),
  carteira AS (
    SELECT l.consultor_id, count(*) AS qtd, COALESCE(sum(l.valor_estimado), 0) AS vgv
    FROM public.arqo_leads l, w
    WHERE l.consultor_id IS NOT NULL AND l.is_active = true
      AND l.created_at >= w.lo AND l.created_at < w.hi
    GROUP BY l.consultor_id
  ),
  visitas AS (
    SELECT a.responsavel_id, count(*) AS n
    FROM public.arqo_agendamentos a, w
    WHERE a.tipo = 'visita' AND a.status = 'realizado'
      AND a.data_hora >= w.lo AND a.data_hora < w.hi
    GROUP BY a.responsavel_id
  )
  SELECT p.id,
         COALESCE(p.full_name, 'Usuário'),
         COALESCE(v.n, 0)::int,
         COALESCE(c.qtd, 0)::int,
         COALESCE(c.vgv, 0)
  FROM public.profiles p
  LEFT JOIN carteira c ON c.consultor_id = p.id
  LEFT JOIN visitas  v ON v.responsavel_id = p.id
  WHERE p.is_active = true
    AND (c.consultor_id IS NOT NULL OR v.responsavel_id IS NOT NULL)
  ORDER BY c.vgv DESC NULLS LAST, v.n DESC NULLS LAST, c.qtd DESC NULLS LAST
  LIMIT GREATEST(p_limit, 1);
$$;

-- Leads ARQO por empreendimento no mês (agregado no servidor: evita o corte de 1000
-- linhas do PostgREST com dezenas de milhares de leads).
CREATE OR REPLACE FUNCTION public.arqo_leads_empreendimento_mes(p_ref date DEFAULT current_date)
RETURNS TABLE(empreendimento_id uuid, qtd int)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH w AS (
    SELECT date_trunc('month', p_ref::timestamptz) AS lo,
           date_trunc('month', p_ref::timestamptz) + interval '1 month' AS hi
  )
  SELECT l.empreendimento_id, count(*)::int
  FROM public.arqo_leads l, w
  WHERE l.empreendimento_id IS NOT NULL AND l.created_at >= w.lo AND l.created_at < w.hi
  GROUP BY l.empreendimento_id;
$$;

GRANT EXECUTE ON FUNCTION public.arqo_dashboard_operacao(date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.arqo_top_consultores(int, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.arqo_leads_empreendimento_mes(date) TO authenticated;
