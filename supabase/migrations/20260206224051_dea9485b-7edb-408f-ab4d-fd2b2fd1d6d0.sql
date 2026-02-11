
-- ============ BLOCO 4: Rastreamento de Tempo de Negociação ============
ALTER TABLE public.negociacoes 
ADD COLUMN IF NOT EXISTS data_primeiro_atendimento timestamptz,
ADD COLUMN IF NOT EXISTS data_proposta_gerada timestamptz,
ADD COLUMN IF NOT EXISTS data_contrato_gerado timestamptz;

-- ============ BLOCO 10: Múltiplos Responsáveis Marketing ============
CREATE TABLE IF NOT EXISTS public.projeto_responsaveis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  projeto_id uuid NOT NULL REFERENCES public.projetos_marketing(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT projeto_responsaveis_unique UNIQUE (projeto_id, user_id)
);

ALTER TABLE public.projeto_responsaveis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view projeto_responsaveis"
ON public.projeto_responsaveis FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert projeto_responsaveis"
ON public.projeto_responsaveis FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can delete projeto_responsaveis"
ON public.projeto_responsaveis FOR DELETE TO authenticated USING (true);

-- ============ BLOCO 8: Sistema de Notificações ============
CREATE TABLE IF NOT EXISTS public.notificacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tipo text NOT NULL DEFAULT 'info',
  titulo text NOT NULL,
  mensagem text NOT NULL,
  referencia_id uuid,
  referencia_tipo text,
  lida boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
ON public.notificacoes FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
ON public.notificacoes FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can insert notifications"
ON public.notificacoes FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "Users can delete own notifications"
ON public.notificacoes FOR DELETE TO authenticated
USING (auth.uid() = user_id);

CREATE INDEX idx_notificacoes_user_lida ON public.notificacoes(user_id, lida);
CREATE INDEX idx_notificacoes_created_at ON public.notificacoes(created_at DESC);
CREATE INDEX idx_projeto_responsaveis_projeto ON public.projeto_responsaveis(projeto_id);
CREATE INDEX idx_projeto_responsaveis_user ON public.projeto_responsaveis(user_id);
