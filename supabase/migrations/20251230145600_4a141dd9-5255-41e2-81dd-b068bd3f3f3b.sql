-- Tabela para armazenar o mapa do empreendimento
CREATE TABLE public.mapa_empreendimento (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empreendimento_id uuid REFERENCES public.empreendimentos(id) ON DELETE CASCADE NOT NULL UNIQUE,
  imagem_url text NOT NULL,
  largura integer,
  altura integer,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Adicionar coluna polygon_coords na tabela unidades
ALTER TABLE public.unidades 
ADD COLUMN polygon_coords jsonb;

-- Trigger para updated_at
CREATE TRIGGER update_mapa_empreendimento_updated_at
BEFORE UPDATE ON public.mapa_empreendimento
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- RLS para mapa_empreendimento
ALTER TABLE public.mapa_empreendimento ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage mapas"
ON public.mapa_empreendimento
FOR ALL
USING (public.is_admin(auth.uid()));

CREATE POLICY "Gestores can manage mapas"
ON public.mapa_empreendimento
FOR ALL
USING (public.has_role(auth.uid(), 'gestor_produto'));

CREATE POLICY "Users can view mapas of authorized empreendimentos"
ON public.mapa_empreendimento
FOR SELECT
USING (public.user_has_empreendimento_access(auth.uid(), empreendimento_id));

-- Índice para performance
CREATE INDEX idx_mapa_empreendimento_empreendimento_id ON public.mapa_empreendimento(empreendimento_id);