
CREATE TABLE public.negociacao_comentarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  negociacao_id UUID NOT NULL REFERENCES public.negociacoes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  comentario TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.negociacao_comentarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read comments"
  ON public.negociacao_comentarios FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert comments"
  ON public.negociacao_comentarios FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
