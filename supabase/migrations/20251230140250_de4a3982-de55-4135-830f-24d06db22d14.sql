-- Corrigir função update_updated_at_column adicionando search_path
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  NEW.updated_at = now();
  return NEW;
end;
$$;