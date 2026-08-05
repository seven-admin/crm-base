-- NEXA · hard delete de meta, exclusivo super_admin (fecha o CRUD de metas).
-- Via RPC SECURITY DEFINER: apaga fisicamente (nexa_meta_usuarios some por CASCADE)
-- e levanta erro claro se não for super_admin ou se a meta não existir — em vez do
-- DELETE do client, que sob RLS vira um no-op silencioso para quem não tem permissão.
CREATE OR REPLACE FUNCTION public.nexa_excluir_meta(p_meta_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_deleted uuid;
BEGIN
  IF v_user IS NULL OR NOT public.is_super_admin(v_user) THEN
    RAISE EXCEPTION 'Usuário sem permissão para excluir metas';
  END IF;
  IF p_meta_id IS NULL THEN
    RAISE EXCEPTION 'Informe a meta a excluir';
  END IF;

  DELETE FROM public.nexa_metas WHERE id = p_meta_id RETURNING id INTO v_deleted;
  IF v_deleted IS NULL THEN
    RAISE EXCEPTION 'Meta não encontrada';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.nexa_excluir_meta(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.nexa_excluir_meta(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.nexa_excluir_meta(uuid) TO authenticated;
