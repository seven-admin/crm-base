
-- Criar tabela atividade_etapas
CREATE TABLE public.atividade_etapas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  cor TEXT NOT NULL DEFAULT '#3b82f6',
  cor_bg TEXT NOT NULL DEFAULT '#dbeafe',
  ordem INT NOT NULL DEFAULT 0,
  is_inicial BOOLEAN NOT NULL DEFAULT false,
  is_final BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.atividade_etapas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leitura publica atividade_etapas"
  ON public.atividade_etapas FOR SELECT
  USING (true);

CREATE POLICY "Admins gerenciam atividade_etapas"
  ON public.atividade_etapas FOR ALL
  USING (public.is_admin(auth.uid()));

-- Trigger updated_at
CREATE TRIGGER update_atividade_etapas_updated_at
  BEFORE UPDATE ON public.atividade_etapas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Adicionar coluna atividade_etapa_id na tabela atividades
ALTER TABLE public.atividades ADD COLUMN atividade_etapa_id UUID REFERENCES public.atividade_etapas(id);

-- Dados iniciais
INSERT INTO public.atividade_etapas (nome, cor, cor_bg, ordem, is_inicial) VALUES
  ('Pendente', '#F59E0B', '#fef3c7', 0, true);
INSERT INTO public.atividade_etapas (nome, cor, cor_bg, ordem, is_final) VALUES
  ('Concluída', '#10B981', '#d1fae5', 1, true);
INSERT INTO public.atividade_etapas (nome, cor, cor_bg, ordem) VALUES
  ('Cancelada', '#94A3B8', '#f1f5f9', 2);
