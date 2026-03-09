-- Novos campos na tabela eventos
ALTER TABLE public.eventos 
  ADD COLUMN IF NOT EXISTS inscricoes_abertas boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS limite_inscricoes integer;

-- Tabela de inscrições
CREATE TABLE public.evento_inscricoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evento_id uuid NOT NULL REFERENCES public.eventos(id) ON DELETE CASCADE,
  corretor_id uuid REFERENCES public.corretores(id),
  user_id uuid NOT NULL REFERENCES public.profiles(id),
  nome_corretor text NOT NULL,
  telefone text,
  email text,
  imobiliaria_nome text,
  status text NOT NULL DEFAULT 'confirmada' CHECK (status IN ('confirmada', 'cancelada')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(evento_id, user_id)
);

-- RLS
ALTER TABLE public.evento_inscricoes ENABLE ROW LEVEL SECURITY;

-- Corretores/gestores podem ver suas próprias inscrições
CREATE POLICY "Users can view own inscricoes"
  ON public.evento_inscricoes FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR public.is_seven_team(auth.uid())
    OR public.is_admin(auth.uid())
  );

-- Corretores/gestores podem inserir suas próprias inscrições
CREATE POLICY "Users can insert own inscricoes"
  ON public.evento_inscricoes FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Corretores/gestores podem atualizar suas próprias inscrições
CREATE POLICY "Users can update own inscricoes"
  ON public.evento_inscricoes FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());