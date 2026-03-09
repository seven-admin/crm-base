CREATE OR REPLACE FUNCTION public.prevent_gestor_id_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.gestor_id IS NOT NULL 
     AND NEW.gestor_id IS DISTINCT FROM OLD.gestor_id 
     AND NOT public.is_super_admin(auth.uid()) THEN
    NEW.gestor_id := OLD.gestor_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;