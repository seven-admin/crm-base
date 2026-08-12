-- Agregados da home comercial (superadmin): produção + carteira de negócios ARQO,
-- e ranking dos consultores de relacionamento. Tudo agregado no servidor para não
-- esbarrar no corte de 1000 linhas do PostgREST com dezenas de milhares de leads.

-- Card superior: produção do mês + carteira de negócios (Proposta/Assinado + VGV).
CREATE OR REPLACE FUNCTION public.arqo_dashboard_operacao()
RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT jsonb_build_object(
    'producao', jsonb_build_object(
      'prospeccao',  (SELECT count(*) FROM public.arqo_leads WHERE created_at >= date_trunc('month', now())),
      'agendamento', (SELECT count(*) FROM public.arqo_agendamentos WHERE created_at >= date_trunc('month', now()) AND status <> 'cancelado'),
      'atendimento', (SELECT count(*) FROM public.arqo_atendimentos WHERE encerrado_em >= date_trunc('month', now()))
    ),
    'carteira', (
      SELECT jsonb_build_object(
        'proposta_qtd', COALESCE(count(*) FILTER (WHERE e.nome = 'Proposta'), 0),
        'assinado_qtd', COALESCE(count(*) FILTER (WHERE e.categoria = 'ganho'), 0),
        'vgv',          COALESCE(sum(l.valor_estimado) FILTER (WHERE e.nome = 'Proposta' OR e.categoria = 'ganho'), 0)
      )
      FROM public.arqo_leads l
      JOIN public.arqo_funil_etapas e ON e.id = l.etapa_id
      WHERE l.is_active = true
    )
  );
$$;

-- Ranking dos consultores de relacionamento: visitas efetivadas no mês, tamanho da
-- carteira (QTD) e VGV da carteira (soma de valor_estimado dos leads ativos em aberto).
CREATE OR REPLACE FUNCTION public.arqo_top_consultores(p_limit int DEFAULT 7)
RETURNS TABLE(consultor_id uuid, nome text, visitas int, qtd_leads int, vgv numeric)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH carteira AS (
    SELECT l.consultor_id, count(*) AS qtd, COALESCE(sum(l.valor_estimado), 0) AS vgv
    FROM public.arqo_leads l
    WHERE l.consultor_id IS NOT NULL AND l.is_active = true AND l.fechado_em IS NULL
    GROUP BY l.consultor_id
  ),
  visitas AS (
    SELECT a.responsavel_id, count(*) AS n
    FROM public.arqo_agendamentos a
    WHERE a.tipo = 'visita' AND a.status = 'realizado'
      AND a.data_hora >= date_trunc('month', now())
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

GRANT EXECUTE ON FUNCTION public.arqo_dashboard_operacao() TO authenticated;
GRANT EXECUTE ON FUNCTION public.arqo_top_consultores(int) TO authenticated;
