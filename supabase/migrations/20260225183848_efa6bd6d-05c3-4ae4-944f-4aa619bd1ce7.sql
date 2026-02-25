
-- Tabela para configurar tipos de atendimento vinculados ao kanban de negociações
CREATE TABLE public.tipos_atendimento_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  tipo_atividade TEXT NOT NULL,
  descricao TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  ordem INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tipos_atendimento_config ENABLE ROW LEVEL SECURITY;

-- Políticas: leitura para todos autenticados, escrita apenas admin
CREATE POLICY "Tipos atendimento visíveis para autenticados"
ON public.tipos_atendimento_config FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Apenas admin pode inserir tipos atendimento"
ON public.tipos_atendimento_config FOR INSERT
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Apenas admin pode atualizar tipos atendimento"
ON public.tipos_atendimento_config FOR UPDATE
USING (public.is_admin(auth.uid()));

CREATE POLICY "Apenas admin pode deletar tipos atendimento"
ON public.tipos_atendimento_config FOR DELETE
USING (public.is_admin(auth.uid()));

-- Trigger de updated_at
CREATE TRIGGER update_tipos_atendimento_config_updated_at
BEFORE UPDATE ON public.tipos_atendimento_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir os 3 tipos padrão
INSERT INTO public.tipos_atendimento_config (nome, tipo_atividade, ordem) VALUES
  ('Atendimento', 'atendimento', 1),
  ('Negociação', 'negociacao', 2),
  ('Contra Proposta', 'contra_proposta_atividade', 3);
