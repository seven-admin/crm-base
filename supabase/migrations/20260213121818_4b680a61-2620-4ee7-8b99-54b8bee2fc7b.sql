ALTER TABLE public.imobiliarias ADD COLUMN tipo_pessoa text NOT NULL DEFAULT 'juridica';
ALTER TABLE public.imobiliarias ADD COLUMN cpf text;