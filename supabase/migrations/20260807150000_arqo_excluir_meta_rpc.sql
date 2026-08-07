-- Exclusão de meta de atendimento da ARQO via RPC (mesma abordagem do nexa_excluir_meta):
-- SECURITY DEFINER para não depender de sutilezas de RLS no DELETE (que causavam falha
-- silenciosa / "não consigo excluir"), com erro explícito quando sem permissão ou inexistente.
-- Permissão espelha a policy de escrita de arqo_metas_atendimento.
CREATE OR REPLACE FUNCTION public.arqo_excluir_meta(p_meta_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user uuid := auth.uid();
  v_deleted uuid;
BEGIN
  IF v_user IS NULL OR NOT (
    public.is_admin(v_user)
    OR public.has_role(v_user, 'arqo_admin')
    OR public.has_role(v_user, 'arqo_gestor')
  ) THEN
    RAISE EXCEPTION 'Usuário sem permissão para excluir metas';
  END IF;
  IF p_meta_id IS NULL THEN
    RAISE EXCEPTION 'Informe a meta a excluir';
  END IF;

  -- arqo_meta_usuarios tem FK ON DELETE CASCADE, então os vínculos saem junto.
  DELETE FROM public.arqo_metas_atendimento WHERE id = p_meta_id RETURNING id INTO v_deleted;
  IF v_deleted IS NULL THEN
    RAISE EXCEPTION 'Meta não encontrada';
  END IF;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.arqo_excluir_meta(uuid) TO authenticated;
