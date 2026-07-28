-- Torna os tipos de atividade da Arqo configuráveis pelo admin, em vez de um
-- enum fixo ('visita','reuniao','ligacao','outro') travado por CHECK.

CREATE TABLE IF NOT EXISTS public.arqo_atividade_tipos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo text NOT NULL UNIQUE,
  rotulo text NOT NULL,
  ordem integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_arqo_atividade_tipos_ordem
  ON public.arqo_atividade_tipos(ordem)
  WHERE is_active;

ALTER TABLE public.arqo_atividade_tipos ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.arqo_atividade_tipos TO authenticated;
GRANT ALL ON public.arqo_atividade_tipos TO service_role;

-- Todos os autenticados leem (para preencher o seletor); só admin/arqo_admin edita.
DROP POLICY IF EXISTS arqo_atividade_tipos_select ON public.arqo_atividade_tipos;
CREATE POLICY arqo_atividade_tipos_select ON public.arqo_atividade_tipos
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS arqo_atividade_tipos_write ON public.arqo_atividade_tipos;
CREATE POLICY arqo_atividade_tipos_write ON public.arqo_atividade_tipos
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()) OR public.has_role(auth.uid(), 'arqo_admin'))
  WITH CHECK (public.is_admin(auth.uid()) OR public.has_role(auth.uid(), 'arqo_admin'));

CREATE TRIGGER trg_arqo_atividade_tipos_upd
  BEFORE UPDATE ON public.arqo_atividade_tipos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Semeia os tipos legados já existentes.
INSERT INTO public.arqo_atividade_tipos (codigo, rotulo, ordem) VALUES
  ('visita', 'Visita', 1),
  ('reuniao', 'Reunião', 2),
  ('ligacao', 'Ligação', 3),
  ('outro', 'Outro', 4)
ON CONFLICT (codigo) DO NOTHING;

-- O tipo do agendamento deixa de ser enum fixo: passa a aceitar qualquer código
-- cadastrado em arqo_atividade_tipos (validação feita na aplicação, como em
-- arqo_atendimentos.status_codigo).
ALTER TABLE public.arqo_agendamentos
  DROP CONSTRAINT IF EXISTS arqo_agendamentos_tipo_check;
