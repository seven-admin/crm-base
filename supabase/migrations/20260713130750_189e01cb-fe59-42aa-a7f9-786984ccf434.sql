CREATE OR REPLACE FUNCTION public.arqo_delete_leads_bulk(
  p_lead_ids UUID[],
  p_delete_lead_clients BOOLEAN DEFAULT false
) RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INT := 0;
  v_client_ids UUID[];
BEGIN
  IF NOT (public.is_admin(auth.uid()) OR public.is_super_admin(auth.uid())) THEN
    RAISE EXCEPTION 'Somente administradores podem excluir leads em lote';
  END IF;

  IF p_lead_ids IS NULL OR array_length(p_lead_ids, 1) IS NULL THEN
    RETURN 0;
  END IF;

  SELECT array_agg(DISTINCT cliente_id) INTO v_client_ids
    FROM public.arqo_leads WHERE id = ANY(p_lead_ids) AND cliente_id IS NOT NULL;

  -- Desabilita triggers de somente leitura temporariamente
  ALTER TABLE public.arqo_lead_events DISABLE TRIGGER trg_arqo_events_no_del;
  DELETE FROM public.arqo_lead_events WHERE lead_id = ANY(p_lead_ids);
  ALTER TABLE public.arqo_lead_events ENABLE TRIGGER trg_arqo_events_no_del;

  DELETE FROM public.arqo_agendamentos WHERE lead_id = ANY(p_lead_ids);
  DELETE FROM public.arqo_oportunidade_responsaveis WHERE lead_id = ANY(p_lead_ids);

  DELETE FROM public.arqo_leads WHERE id = ANY(p_lead_ids);
  GET DIAGNOSTICS v_count = ROW_COUNT;

  IF p_delete_lead_clients AND v_client_ids IS NOT NULL THEN
    DELETE FROM public.seven_clientes c
    WHERE c.id = ANY(v_client_ids)
      AND c.nivel_cadastro = 'lead'
      AND NOT EXISTS (SELECT 1 FROM public.arqo_leads l WHERE l.cliente_id = c.id);
  END IF;

  RETURN v_count;
END;
$$;