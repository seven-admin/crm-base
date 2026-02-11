-- Create enum for funnel stages
CREATE TYPE etapa_funil AS ENUM (
  'lead', 
  'atendimento', 
  'proposta', 
  'negociacao', 
  'fechado', 
  'perdido'
);

-- Create clientes table
CREATE TABLE public.clientes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT,
  telefone TEXT,
  whatsapp TEXT,
  cpf TEXT,
  rg TEXT,
  data_nascimento DATE,
  profissao TEXT,
  renda_mensal NUMERIC,
  endereco_logradouro TEXT,
  endereco_numero TEXT,
  endereco_complemento TEXT,
  endereco_bairro TEXT,
  endereco_cidade TEXT,
  endereco_uf TEXT,
  endereco_cep TEXT,
  origem TEXT,
  interesse TEXT[],
  observacoes TEXT,
  lead_id UUID REFERENCES public.leads(id),
  corretor_id UUID REFERENCES public.corretores(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create negociacoes table
CREATE TABLE public.negociacoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo TEXT NOT NULL UNIQUE,
  cliente_id UUID NOT NULL REFERENCES public.clientes(id),
  empreendimento_id UUID NOT NULL REFERENCES public.empreendimentos(id),
  corretor_id UUID REFERENCES public.corretores(id),
  imobiliaria_id UUID REFERENCES public.imobiliarias(id),
  etapa etapa_funil NOT NULL DEFAULT 'lead',
  valor_negociacao NUMERIC,
  valor_entrada NUMERIC,
  condicao_pagamento TEXT,
  observacoes TEXT,
  motivo_perda TEXT,
  data_previsao_fechamento DATE,
  data_fechamento DATE,
  ordem_kanban INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create negociacao_unidades junction table
CREATE TABLE public.negociacao_unidades (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  negociacao_id UUID NOT NULL REFERENCES public.negociacoes(id) ON DELETE CASCADE,
  unidade_id UUID NOT NULL REFERENCES public.unidades(id),
  valor_unidade NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(negociacao_id, unidade_id)
);

-- Create negociacao_historico table
CREATE TABLE public.negociacao_historico (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  negociacao_id UUID NOT NULL REFERENCES public.negociacoes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id),
  etapa_anterior etapa_funil,
  etapa_nova etapa_funil NOT NULL,
  observacao TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.negociacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.negociacao_unidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.negociacao_historico ENABLE ROW LEVEL SECURITY;

-- RLS Policies for clientes
CREATE POLICY "Admins can manage clientes" ON public.clientes
  FOR ALL USING (public.is_admin(auth.uid()));

CREATE POLICY "Gestores can manage clientes" ON public.clientes
  FOR ALL USING (public.has_role(auth.uid(), 'gestor_produto'));

CREATE POLICY "Corretores can view clientes" ON public.clientes
  FOR SELECT USING (
    corretor_id IN (
      SELECT c.id FROM public.corretores c
      JOIN public.profiles p ON p.email = c.email
      WHERE p.id = auth.uid()
    )
  );

CREATE POLICY "Corretores can create clientes" ON public.clientes
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Corretores can update own clientes" ON public.clientes
  FOR UPDATE USING (
    corretor_id IN (
      SELECT c.id FROM public.corretores c
      JOIN public.profiles p ON p.email = c.email
      WHERE p.id = auth.uid()
    )
  );

-- RLS Policies for negociacoes
CREATE POLICY "Admins can manage negociacoes" ON public.negociacoes
  FOR ALL USING (public.is_admin(auth.uid()));

CREATE POLICY "Gestores can manage negociacoes" ON public.negociacoes
  FOR ALL USING (public.has_role(auth.uid(), 'gestor_produto'));

CREATE POLICY "Corretores can view own negociacoes" ON public.negociacoes
  FOR SELECT USING (
    corretor_id IN (
      SELECT c.id FROM public.corretores c
      JOIN public.profiles p ON p.email = c.email
      WHERE p.id = auth.uid()
    )
  );

CREATE POLICY "Corretores can create negociacoes" ON public.negociacoes
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Corretores can update own negociacoes" ON public.negociacoes
  FOR UPDATE USING (
    corretor_id IN (
      SELECT c.id FROM public.corretores c
      JOIN public.profiles p ON p.email = c.email
      WHERE p.id = auth.uid()
    )
  );

-- RLS Policies for negociacao_unidades
CREATE POLICY "Admins can manage negociacao_unidades" ON public.negociacao_unidades
  FOR ALL USING (public.is_admin(auth.uid()));

CREATE POLICY "Gestores can manage negociacao_unidades" ON public.negociacao_unidades
  FOR ALL USING (public.has_role(auth.uid(), 'gestor_produto'));

CREATE POLICY "Users can view negociacao_unidades" ON public.negociacao_unidades
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.negociacoes n
      WHERE n.id = negociacao_id
      AND (
        public.is_admin(auth.uid())
        OR public.has_role(auth.uid(), 'gestor_produto')
        OR n.corretor_id IN (
          SELECT c.id FROM public.corretores c
          JOIN public.profiles p ON p.email = c.email
          WHERE p.id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can insert negociacao_unidades" ON public.negociacao_unidades
  FOR INSERT WITH CHECK (true);

-- RLS Policies for negociacao_historico
CREATE POLICY "Admins can manage negociacao_historico" ON public.negociacao_historico
  FOR ALL USING (public.is_admin(auth.uid()));

CREATE POLICY "Gestores can manage negociacao_historico" ON public.negociacao_historico
  FOR ALL USING (public.has_role(auth.uid(), 'gestor_produto'));

CREATE POLICY "Users can view negociacao_historico" ON public.negociacao_historico
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.negociacoes n
      WHERE n.id = negociacao_id
      AND (
        public.is_admin(auth.uid())
        OR public.has_role(auth.uid(), 'gestor_produto')
        OR n.corretor_id IN (
          SELECT c.id FROM public.corretores c
          JOIN public.profiles p ON p.email = c.email
          WHERE p.id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can insert negociacao_historico" ON public.negociacao_historico
  FOR INSERT WITH CHECK (true);

-- Create triggers for updated_at
CREATE TRIGGER update_clientes_updated_at
  BEFORE UPDATE ON public.clientes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_negociacoes_updated_at
  BEFORE UPDATE ON public.negociacoes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create sequence for negociacao codigo
CREATE SEQUENCE negociacao_codigo_seq START 1;

-- Function to generate negociacao codigo
CREATE OR REPLACE FUNCTION public.generate_negociacao_codigo()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.codigo := 'NEG-' || LPAD(nextval('negociacao_codigo_seq')::TEXT, 5, '0');
  RETURN NEW;
END;
$$;

-- Trigger to auto-generate codigo
CREATE TRIGGER generate_negociacao_codigo_trigger
  BEFORE INSERT ON public.negociacoes
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_negociacao_codigo();

-- Insert modules for funil and clientes
INSERT INTO public.modules (name, display_name, description, icon, route) VALUES
  ('funil', 'Funil de Vendas', 'Gestão do pipeline de vendas em Kanban', 'kanban', '/funil'),
  ('clientes', 'Clientes', 'Cadastro e gestão de clientes', 'users', '/clientes')
ON CONFLICT DO NOTHING;