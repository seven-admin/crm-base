-- Tabela para múltiplos telefones por cliente com identificação de WhatsApp
CREATE TABLE public.cliente_telefones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  numero TEXT NOT NULL,
  is_whatsapp BOOLEAN DEFAULT false,
  descricao TEXT, -- Ex: "Pessoal", "Trabalho", "Comercial"
  principal BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índice para performance
CREATE INDEX idx_cliente_telefones_cliente ON public.cliente_telefones(cliente_id);

-- RLS
ALTER TABLE public.cliente_telefones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view telefones" 
ON public.cliente_telefones FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert telefones" 
ON public.cliente_telefones FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update telefones" 
ON public.cliente_telefones FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete telefones" 
ON public.cliente_telefones FOR DELETE TO authenticated USING (true);

-- Função para garantir apenas um telefone principal por cliente
CREATE OR REPLACE FUNCTION public.ensure_single_principal_telefone()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.principal = true THEN
    UPDATE public.cliente_telefones 
    SET principal = false 
    WHERE cliente_id = NEW.cliente_id 
      AND id != NEW.id 
      AND principal = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER tr_ensure_single_principal_telefone
BEFORE INSERT OR UPDATE ON public.cliente_telefones
FOR EACH ROW EXECUTE FUNCTION public.ensure_single_principal_telefone();