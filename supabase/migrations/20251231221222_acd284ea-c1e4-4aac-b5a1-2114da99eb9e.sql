-- Criar tabela de etapas de tickets do marketing (similar a funil_etapas)
CREATE TABLE IF NOT EXISTS public.ticket_etapas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  cor TEXT DEFAULT '#6b7280',
  cor_bg TEXT DEFAULT '#f3f4f6',
  ordem INTEGER DEFAULT 0,
  categoria TEXT, -- NULL = todas as categorias, ou 'render_3d', 'design_grafico', etc.
  is_inicial BOOLEAN DEFAULT false,
  is_final BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_ticket_etapas_categoria ON public.ticket_etapas(categoria);
CREATE INDEX IF NOT EXISTS idx_ticket_etapas_ordem ON public.ticket_etapas(ordem);

-- Habilitar RLS
ALTER TABLE public.ticket_etapas ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Super admins can manage ticket_etapas"
ON public.ticket_etapas
FOR ALL
USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Admins can view ticket_etapas"
ON public.ticket_etapas
FOR SELECT
USING (public.is_admin(auth.uid()));

CREATE POLICY "Users can view active ticket_etapas"
ON public.ticket_etapas
FOR SELECT
USING (is_active = true);

-- Trigger para updated_at
CREATE TRIGGER update_ticket_etapas_updated_at
  BEFORE UPDATE ON public.ticket_etapas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir etapas padrão (baseadas nas atuais)
INSERT INTO public.ticket_etapas (nome, cor, cor_bg, ordem, categoria, is_inicial, is_final) VALUES
  ('Aguardando Análise', '#f59e0b', '#fffbeb', 0, NULL, true, false),
  ('Em Produção', '#3b82f6', '#eff6ff', 1, NULL, false, false),
  ('Revisão', '#8b5cf6', '#f5f3ff', 2, NULL, false, false),
  ('Aprovação Cliente', '#ec4899', '#fdf2f8', 3, NULL, false, false),
  ('Ajuste', '#f97316', '#fff7ed', 4, NULL, false, false),
  ('Concluído', '#22c55e', '#f0fdf4', 5, NULL, false, true);

-- Adicionar coluna ticket_etapa_id na tabela projetos_marketing
ALTER TABLE public.projetos_marketing ADD COLUMN IF NOT EXISTS ticket_etapa_id UUID REFERENCES public.ticket_etapas(id);