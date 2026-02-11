-- Função para auto-preencher gestor_id quando usuário é gestor_produto
CREATE OR REPLACE FUNCTION public.auto_set_gestor_id_clientes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Se gestor_id não foi informado e o usuário é gestor_produto, preencher automaticamente
  IF NEW.gestor_id IS NULL AND public.has_role(auth.uid(), 'gestor_produto') THEN
    NEW.gestor_id := auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

-- Criar trigger para auto-preenchimento
DROP TRIGGER IF EXISTS trg_auto_set_gestor_id_clientes ON public.clientes;
CREATE TRIGGER trg_auto_set_gestor_id_clientes
  BEFORE INSERT ON public.clientes
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_set_gestor_id_clientes();