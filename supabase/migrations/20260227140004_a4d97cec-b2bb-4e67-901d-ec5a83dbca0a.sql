ALTER TABLE public.negociacoes 
  DROP CONSTRAINT negociacoes_gestor_id_fkey;

ALTER TABLE public.negociacoes
  ADD CONSTRAINT negociacoes_gestor_id_fkey 
  FOREIGN KEY (gestor_id) REFERENCES public.profiles(id) ON DELETE SET NULL;