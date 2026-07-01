
CREATE OR REPLACE FUNCTION public.get_unidades_disponiveis(p_incorporadora_id uuid)
RETURNS TABLE(
  empreendimento_id uuid,
  empreendimento text,
  incorporadora text,
  bloco text,
  andar integer,
  unidade text,
  tipologia text,
  quartos integer,
  suites integer,
  vagas integer,
  area_privativa numeric,
  valor numeric,
  status text,
  unidade_id uuid
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    e.id                    AS empreendimento_id,
    e.nome                  AS empreendimento,
    i.nome                  AS incorporadora,
    b.nome                  AS bloco,
    u.andar,
    u.numero                AS unidade,
    t.nome                  AS tipologia,
    t.quartos,
    t.suites,
    t.vagas,
    u.area_privativa,
    u.valor,
    u.status::text,
    u.id                    AS unidade_id
  FROM public.unidades u
  JOIN public.empreendimentos e ON e.id = u.empreendimento_id
  LEFT JOIN public.incorporadoras i ON i.id = e.incorporadora_id
  LEFT JOIN public.blocos b      ON b.id = u.bloco_id
  LEFT JOIN public.tipologias t  ON t.id = u.tipologia_id
  WHERE
    e.incorporadora_id = p_incorporadora_id
    AND e.is_active = true
    AND u.is_active = true
    AND u.status = 'disponivel'
  ORDER BY e.nome, b.nome, u.andar, u.numero;
$$;

GRANT EXECUTE ON FUNCTION public.get_unidades_disponiveis(uuid) TO anon, authenticated, service_role;
