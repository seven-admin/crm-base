
CREATE OR REPLACE FUNCTION public.reset_sequence_value(seq_name text, new_value bigint)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
  IF NOT (seq_name = ANY(allowed_sequences)) THEN
    RAISE EXCEPTION 'Sequence não permitida: %', seq_name;
  END IF;
  
  IF new_value < 1 THEN
    RAISE EXCEPTION 'Valor deve ser >= 1';
  END IF;

  EXECUTE format('ALTER SEQUENCE public.%I RESTART WITH %s', seq_name, new_value);
END;
$$;
