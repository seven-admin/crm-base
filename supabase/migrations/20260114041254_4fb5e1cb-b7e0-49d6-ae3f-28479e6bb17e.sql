-- Create fachadas table
CREATE TABLE public.fachadas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empreendimento_id UUID NOT NULL REFERENCES public.empreendimentos(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  descricao TEXT,
  imagem_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add fachada_id column to unidades
ALTER TABLE public.unidades ADD COLUMN fachada_id UUID REFERENCES public.fachadas(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE public.fachadas ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for fachadas (same pattern as blocos)
CREATE POLICY "Fachadas are viewable by authenticated users"
ON public.fachadas
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Fachadas can be created by authenticated users"
ON public.fachadas
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Fachadas can be updated by authenticated users"
ON public.fachadas
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Fachadas can be deleted by authenticated users"
ON public.fachadas
FOR DELETE
TO authenticated
USING (true);

-- Create index for better performance
CREATE INDEX idx_fachadas_empreendimento_id ON public.fachadas(empreendimento_id);
CREATE INDEX idx_unidades_fachada_id ON public.unidades(fachada_id);

-- Create trigger for updated_at
CREATE TRIGGER update_fachadas_updated_at
BEFORE UPDATE ON public.fachadas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();