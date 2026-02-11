-- Tabela de Boxes (Vagas de Estacionamento)
CREATE TABLE public.boxes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empreendimento_id UUID NOT NULL REFERENCES public.empreendimentos(id) ON DELETE CASCADE,
  bloco_id UUID REFERENCES public.blocos(id) ON DELETE SET NULL,
  numero VARCHAR(20) NOT NULL,
  tipo VARCHAR(20) NOT NULL DEFAULT 'simples',
  coberto BOOLEAN NOT NULL DEFAULT false,
  valor DECIMAL(15,2),
  status VARCHAR(20) NOT NULL DEFAULT 'disponivel',
  unidade_id UUID REFERENCES public.unidades(id) ON DELETE SET NULL,
  observacoes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT boxes_empreendimento_numero_unique UNIQUE(empreendimento_id, numero)
);

-- Índices para performance
CREATE INDEX idx_boxes_empreendimento ON public.boxes(empreendimento_id);
CREATE INDEX idx_boxes_status ON public.boxes(status);
CREATE INDEX idx_boxes_unidade ON public.boxes(unidade_id);

-- Enable RLS
ALTER TABLE public.boxes ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "boxes_select_policy" ON public.boxes FOR SELECT USING (true);
CREATE POLICY "boxes_insert_policy" ON public.boxes FOR INSERT WITH CHECK (true);
CREATE POLICY "boxes_update_policy" ON public.boxes FOR UPDATE USING (true);
CREATE POLICY "boxes_delete_policy" ON public.boxes FOR DELETE USING (true);

-- Trigger para updated_at
CREATE TRIGGER update_boxes_updated_at
  BEFORE UPDATE ON public.boxes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();