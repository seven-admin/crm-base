CREATE POLICY "Super admin delete visitas" ON public.nexa_visitas
  FOR DELETE TO authenticated
  USING (public.is_super_admin(auth.uid()));

CREATE OR REPLACE FUNCTION public.nexa_delete_visita(p_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Somente super_admin pode excluir visitas';
  END IF;

  ALTER TABLE public.nexa_visitas_eventos DISABLE TRIGGER trg_nexa_eventos_no_update;
  DELETE FROM public.nexa_visitas_eventos WHERE visita_id = p_id;
  ALTER TABLE public.nexa_visitas_eventos ENABLE TRIGGER trg_nexa_eventos_no_update;

  DELETE FROM public.nexa_visitas WHERE id = p_id;
END;
$$;