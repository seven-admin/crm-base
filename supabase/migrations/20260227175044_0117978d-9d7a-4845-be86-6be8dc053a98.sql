
CREATE OR REPLACE FUNCTION public.get_all_sequence_values()
RETURNS TABLE(seq_name text, last_value bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 'negociacao_codigo_seq'::text, (SELECT last_value FROM public.negociacao_codigo_seq)
  UNION ALL
  SELECT 'negociacao_proposta_seq'::text, (SELECT last_value FROM public.negociacao_proposta_seq)
  UNION ALL
  SELECT 'proposta_numero_seq'::text, (SELECT last_value FROM public.proposta_numero_seq)
  UNION ALL
  SELECT 'briefing_codigo_seq'::text, (SELECT last_value FROM public.briefing_codigo_seq)
  UNION ALL
  SELECT 'projeto_codigo_seq'::text, (SELECT last_value FROM public.projeto_codigo_seq)
  UNION ALL
  SELECT 'contrato_numero_seq'::text, (SELECT last_value FROM public.contrato_numero_seq)
  UNION ALL
  SELECT 'comissao_numero_seq'::text, (SELECT last_value FROM public.comissao_numero_seq)
  UNION ALL
  SELECT 'evento_codigo_seq'::text, (SELECT last_value FROM public.evento_codigo_seq)
  UNION ALL
  SELECT 'reserva_protocolo_seq'::text, (SELECT last_value FROM public.reserva_protocolo_seq);
END;
$$;
