-- 1a) Atualizar política de SELECT para incluir created_by
DROP POLICY IF EXISTS "Users can view own atividades" ON atividades;
CREATE POLICY "Users can view own atividades"
ON atividades FOR SELECT TO authenticated
USING (
  gestor_id = auth.uid() 
  OR created_by = auth.uid()
  OR corretor_id IN (SELECT get_corretor_ids_by_user(auth.uid()))
);

-- 1b) Atualizar política de UPDATE para incluir created_by
DROP POLICY IF EXISTS "Users can update own atividades" ON atividades;
CREATE POLICY "Users can update own atividades"
ON atividades FOR UPDATE TO authenticated
USING (
  gestor_id = auth.uid() 
  OR created_by = auth.uid()
  OR corretor_id IN (SELECT get_corretor_ids_by_user(auth.uid()))
);

-- 2) Trigger para auto-preencher gestor_id quando criador é gestor_produto
CREATE OR REPLACE FUNCTION public.auto_set_gestor_id_atividades()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NEW.gestor_id IS NULL AND public.has_role(auth.uid(), 'gestor_produto') THEN
    NEW.gestor_id := auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_set_gestor_id_atividades ON public.atividades;
CREATE TRIGGER trg_auto_set_gestor_id_atividades
BEFORE INSERT ON public.atividades
FOR EACH ROW EXECUTE FUNCTION public.auto_set_gestor_id_atividades();