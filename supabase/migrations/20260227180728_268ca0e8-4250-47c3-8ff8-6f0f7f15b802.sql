
CREATE OR REPLACE FUNCTION public.get_all_sequence_values()
 RETURNS TABLE(seq_name text, last_value bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Acesso negado: apenas super administradores';
  END IF;

  RETURN QUERY
  SELECT 'negociacao_codigo_seq'::text, (SELECT s.last_value FROM public.negociacao_codigo_seq s)
  UNION ALL
  SELECT 'negociacao_proposta_seq'::text, (SELECT s.last_value FROM public.negociacao_proposta_seq s)
  UNION ALL
  SELECT 'proposta_numero_seq'::text, (SELECT s.last_value FROM public.proposta_numero_seq s)
  UNION ALL
  SELECT 'briefing_codigo_seq'::text, (SELECT s.last_value FROM public.briefing_codigo_seq s)
  UNION ALL
  SELECT 'projeto_codigo_seq'::text, (SELECT s.last_value FROM public.projeto_codigo_seq s)
  UNION ALL
  SELECT 'contrato_numero_seq'::text, (SELECT s.last_value FROM public.contrato_numero_seq s)
  UNION ALL
  SELECT 'comissao_numero_seq'::text, (SELECT s.last_value FROM public.comissao_numero_seq s)
  UNION ALL
  SELECT 'evento_codigo_seq'::text, (SELECT s.last_value FROM public.evento_codigo_seq s)
  UNION ALL
  SELECT 'reserva_protocolo_seq'::text, (SELECT s.last_value FROM public.reserva_protocolo_seq s);
END;
$function$;

CREATE OR REPLACE FUNCTION public.reset_sequence_value(seq_name text, new_value bigint)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  allowed_sequences text[] := ARRAY[
    'negociacao_codigo_seq',
    'negociacao_proposta_seq',
    'proposta_numero_seq',
    'briefing_codigo_seq',
    'projeto_codigo_seq',
    'contrato_numero_seq',
    'comissao_numero_seq',
    'evento_codigo_seq',
    'reserva_protocolo_seq'
  ];
BEGIN
  IF NOT public.is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Acesso negado: apenas super administradores';
  END IF;

  IF NOT (seq_name = ANY(allowed_sequences)) THEN
    RAISE EXCEPTION 'Sequence não permitida: %', seq_name;
  END IF;
  
  IF new_value < 1 THEN
    RAISE EXCEPTION 'Valor deve ser >= 1';
  END IF;

  EXECUTE format('ALTER SEQUENCE public.%I RESTART WITH %s', seq_name, new_value);
END;
$function$;
