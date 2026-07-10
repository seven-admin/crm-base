CREATE OR REPLACE FUNCTION public.arqo_liberar_consultor(p_lead_id uuid, p_comentario text DEFAULT NULL)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_consultor uuid;
BEGIN
  SELECT consultor_id INTO v_consultor FROM public.arqo_leads WHERE id = p_lead_id;
  UPDATE public.arqo_leads SET consultor_id = NULL, updated_at = now() WHERE id = p_lead_id;
  INSERT INTO public.arqo_lead_events (lead_id, tipo, usuario_id, payload, comentario)
  VALUES (p_lead_id, 'liberacao_consultor', auth.uid(), jsonb_build_object('consultor_anterior', v_consultor), p_comentario);
END;
$function$;