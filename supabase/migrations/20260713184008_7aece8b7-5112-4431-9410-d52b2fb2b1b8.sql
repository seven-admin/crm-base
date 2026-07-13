CREATE OR REPLACE FUNCTION public.prevent_gestor_id_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF OLD.gestor_id IS NOT NULL 
     AND NEW.gestor_id IS DISTINCT FROM OLD.gestor_id 
     AND COALESCE(auth.role(), '') <> 'service_role'
     AND NOT public.is_super_admin(auth.uid()) THEN
    NEW.gestor_id := OLD.gestor_id;
  END IF;
  RETURN NEW;
END;
$function$;