
-- Table for dação attachments
CREATE TABLE public.negociacao_dacao_anexos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  negociacao_id UUID NOT NULL REFERENCES public.negociacoes(id) ON DELETE CASCADE,
  tipo_dacao TEXT NOT NULL DEFAULT 'outro',
  descricao TEXT,
  arquivo_url TEXT NOT NULL,
  arquivo_nome TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.negociacao_dacao_anexos ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Authenticated users can view dacao anexos"
  ON public.negociacao_dacao_anexos FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert dacao anexos"
  ON public.negociacao_dacao_anexos FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own dacao anexos"
  ON public.negociacao_dacao_anexos FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own dacao anexos"
  ON public.negociacao_dacao_anexos FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

-- Storage bucket for dação images
INSERT INTO storage.buckets (id, name, public)
VALUES ('negociacao-dacao', 'negociacao-dacao', true);

-- Storage RLS policies
CREATE POLICY "Authenticated users can upload dacao files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'negociacao-dacao');

CREATE POLICY "Anyone can view dacao files"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'negociacao-dacao');

CREATE POLICY "Authenticated users can delete dacao files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'negociacao-dacao');
