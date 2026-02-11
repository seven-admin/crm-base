-- Alterar default de is_active para false na tabela profiles
-- Novos usuários precisam ser ativados por admin antes de poder acessar
ALTER TABLE public.profiles ALTER COLUMN is_active SET DEFAULT false;

-- Atualizar o trigger handle_new_user para explicitamente definir is_active = false
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
begin
  insert into public.profiles (id, full_name, email, is_active)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    new.email,
    false  -- Novos usuários ficam inativos até ativação por admin
  );
  return new;
end;
$function$;