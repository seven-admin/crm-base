ALTER TABLE public.projetos_marketing
  ADD COLUMN created_by uuid REFERENCES auth.users(id);