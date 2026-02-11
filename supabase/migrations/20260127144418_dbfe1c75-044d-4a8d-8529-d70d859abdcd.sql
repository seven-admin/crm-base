-- Tabela de comentários/interações em atividades
CREATE TABLE public.atividade_comentarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  atividade_id UUID NOT NULL REFERENCES public.atividades(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  comentario TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índice para performance
CREATE INDEX idx_atividade_comentarios_atividade ON public.atividade_comentarios(atividade_id);

-- RLS
ALTER TABLE public.atividade_comentarios ENABLE ROW LEVEL SECURITY;

-- Política: usuários autenticados podem ver comentários
CREATE POLICY "Authenticated users can view comments"
  ON public.atividade_comentarios FOR SELECT
  TO authenticated
  USING (true);

-- Política: usuários autenticados podem criar comentários
CREATE POLICY "Authenticated users can create comments"
  ON public.atividade_comentarios FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);