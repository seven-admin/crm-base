-- Add column to configure which elements appear in map labels
ALTER TABLE public.empreendimentos
ADD COLUMN mapa_label_formato text[] DEFAULT ARRAY['bloco', 'tipologia', 'numero'];