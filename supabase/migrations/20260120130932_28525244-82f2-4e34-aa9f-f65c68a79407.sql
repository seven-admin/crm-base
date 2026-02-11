-- Trigger para impedir alteração de gestor_id (campo imutável)
CREATE OR REPLACE FUNCTION public.prevent_gestor_id_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Se gestor_id está sendo alterado, preservar o original
  IF OLD.gestor_id IS NOT NULL AND NEW.gestor_id IS DISTINCT FROM OLD.gestor_id THEN
    NEW.gestor_id := OLD.gestor_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger na tabela atividades
DROP TRIGGER IF EXISTS trigger_prevent_gestor_id_change ON public.atividades;
CREATE TRIGGER trigger_prevent_gestor_id_change
  BEFORE UPDATE ON public.atividades
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_gestor_id_change();