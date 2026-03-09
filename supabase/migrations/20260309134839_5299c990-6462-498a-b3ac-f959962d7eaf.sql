
-- Tabela de responsáveis múltiplos para atividades
CREATE TABLE public.atividade_responsaveis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  atividade_id uuid NOT NULL REFERENCES public.atividades(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT atividade_responsaveis_unique UNIQUE (atividade_id, user_id)
);

-- RLS
ALTER TABLE public.atividade_responsaveis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view atividade_responsaveis"
  ON public.atividade_responsaveis FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert atividade_responsaveis"
  ON public.atividade_responsaveis FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can delete atividade_responsaveis"
  ON public.atividade_responsaveis FOR DELETE TO authenticated USING (true);
