ALTER TABLE public.projetos_marketing 
ADD CONSTRAINT fk_projetos_marketing_created_by 
FOREIGN KEY (created_by) REFERENCES public.profiles(id);