-- Criar tabela de metas comerciais
CREATE TABLE public.metas_comerciais (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  competencia DATE NOT NULL,
  empreendimento_id UUID REFERENCES public.empreendimentos(id) ON DELETE CASCADE,
  corretor_id UUID REFERENCES public.corretores(id) ON DELETE CASCADE,
  meta_valor NUMERIC NOT NULL DEFAULT 0,
  meta_unidades INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (competencia, empreendimento_id, corretor_id)
);

-- Enable RLS
ALTER TABLE public.metas_comerciais ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Admins can manage metas_comerciais"
ON public.metas_comerciais FOR ALL
USING (is_admin(auth.uid()));

CREATE POLICY "Gestores can manage metas_comerciais"
ON public.metas_comerciais FOR ALL
USING (has_role(auth.uid(), 'gestor_produto'::app_role));

CREATE POLICY "Users can view metas_comerciais"
ON public.metas_comerciais FOR SELECT
USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_metas_comerciais_updated_at
BEFORE UPDATE ON public.metas_comerciais
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();