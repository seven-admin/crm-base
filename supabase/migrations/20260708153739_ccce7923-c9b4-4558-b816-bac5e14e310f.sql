
DROP TABLE IF EXISTS public.evento_inscricoes CASCADE;
DROP TABLE IF EXISTS public.evento_membros CASCADE;
DROP TABLE IF EXISTS public.evento_tarefas CASCADE;
DROP TABLE IF EXISTS public.evento_template_tarefas CASCADE;
DROP TABLE IF EXISTS public.evento_templates CASCADE;
DROP TABLE IF EXISTS public.eventos CASCADE;

DROP TABLE IF EXISTS public.ticket_criativos CASCADE;
DROP TABLE IF EXISTS public.ticket_etapas CASCADE;
DROP TABLE IF EXISTS public.projeto_comentarios CASCADE;
DROP TABLE IF EXISTS public.projeto_historico CASCADE;
DROP TABLE IF EXISTS public.projeto_responsaveis CASCADE;
DROP TABLE IF EXISTS public.tarefas_projeto CASCADE;
DROP TABLE IF EXISTS public.projetos_marketing CASCADE;
DROP TABLE IF EXISTS public.briefing_referencias CASCADE;
DROP TABLE IF EXISTS public.briefings CASCADE;

DROP TABLE IF EXISTS public.planejamento_historico CASCADE;
DROP TABLE IF EXISTS public.planejamento_item_responsaveis CASCADE;
DROP TABLE IF EXISTS public.planejamento_itens CASCADE;
DROP TABLE IF EXISTS public.planejamento_fases CASCADE;
DROP TABLE IF EXISTS public.planejamento_status CASCADE;
DROP TABLE IF EXISTS public.google_calendar_embeds CASCADE;

DROP SEQUENCE IF EXISTS public.evento_codigo_seq CASCADE;
DROP SEQUENCE IF EXISTS public.projeto_codigo_seq CASCADE;
DROP SEQUENCE IF EXISTS public.briefing_codigo_seq CASCADE;

DROP FUNCTION IF EXISTS public.generate_evento_codigo() CASCADE;
DROP FUNCTION IF EXISTS public.generate_projeto_codigo() CASCADE;
DROP FUNCTION IF EXISTS public.generate_briefing_codigo() CASCADE;
DROP FUNCTION IF EXISTS public.log_planejamento_changes() CASCADE;
DROP FUNCTION IF EXISTS public.is_marketing_supervisor(uuid) CASCADE;

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
    'contrato_numero_seq',
    'comissao_numero_seq',
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
  SELECT 'contrato_numero_seq'::text, (SELECT s.last_value FROM public.contrato_numero_seq s)
  UNION ALL
  SELECT 'comissao_numero_seq'::text, (SELECT s.last_value FROM public.comissao_numero_seq s)
  UNION ALL
  SELECT 'reserva_protocolo_seq'::text, (SELECT s.last_value FROM public.reserva_protocolo_seq s);
END;
$function$;

DELETE FROM public.modules WHERE name IN (
  'projetos_marketing',
  'projetos_marketing_config',
  'briefings',
  'eventos',
  'eventos_templates',
  'planejamento',
  'planejamento_config'
);

DELETE FROM public.configuracoes_sistema WHERE chave = 'planejamento_limite_sobrecarga';
