-- Create atividades table
CREATE TABLE IF NOT EXISTS public.atividades (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo TEXT NOT NULL,
  titulo TEXT NOT NULL,
  data_hora TIMESTAMP WITH TIME ZONE NOT NULL,
  duracao_minutos INTEGER DEFAULT 30,
  cliente_id UUID REFERENCES public.clientes(id),
  corretor_id UUID REFERENCES public.corretores(id),
  imobiliaria_id UUID REFERENCES public.imobiliarias(id),
  empreendimento_id UUID REFERENCES public.empreendimentos(id),
  gestor_id UUID REFERENCES public.profiles(id),
  status TEXT NOT NULL DEFAULT 'pendente',
  resultado TEXT,
  observacoes TEXT,
  temperatura_cliente TEXT,
  requer_followup BOOLEAN DEFAULT false,
  data_followup TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.atividades ENABLE ROW LEVEL SECURITY;

-- Admins can manage all atividades
CREATE POLICY "Admins can manage atividades"
  ON public.atividades FOR ALL
  USING (is_admin(auth.uid()));

-- Gestores can manage atividades
CREATE POLICY "Gestores can manage atividades"
  ON public.atividades FOR ALL
  USING (has_role(auth.uid(), 'gestor_produto'::app_role));

-- Users can view atividades they are associated with
CREATE POLICY "Users can view own atividades"
  ON public.atividades FOR SELECT
  USING (
    gestor_id = auth.uid() OR
    corretor_id IN (
      SELECT c.id FROM corretores c
      JOIN profiles p ON p.email = c.email
      WHERE p.id = auth.uid()
    )
  );

-- Users can create atividades
CREATE POLICY "Users can create atividades"
  ON public.atividades FOR INSERT
  WITH CHECK (true);

-- Users can update their own atividades
CREATE POLICY "Users can update own atividades"
  ON public.atividades FOR UPDATE
  USING (
    gestor_id = auth.uid() OR
    corretor_id IN (
      SELECT c.id FROM corretores c
      JOIN profiles p ON p.email = c.email
      WHERE p.id = auth.uid()
    )
  );

-- Create trigger for updated_at
CREATE TRIGGER update_atividades_updated_at
  BEFORE UPDATE ON public.atividades
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();