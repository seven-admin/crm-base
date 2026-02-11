-- Criar enum proposta_status
CREATE TYPE proposta_status AS ENUM (
  'rascunho',
  'enviada',
  'aceita',
  'recusada',
  'expirada',
  'convertida'
);

-- Sequência para numeração automática
CREATE SEQUENCE proposta_numero_seq START 1;

-- Tabela propostas
CREATE TABLE public.propostas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero TEXT NOT NULL,
  negociacao_id UUID REFERENCES public.negociacoes(id),
  cliente_id UUID NOT NULL REFERENCES public.clientes(id),
  empreendimento_id UUID NOT NULL REFERENCES public.empreendimentos(id),
  corretor_id UUID REFERENCES public.corretores(id),
  imobiliaria_id UUID REFERENCES public.imobiliarias(id),
  data_emissao DATE NOT NULL DEFAULT CURRENT_DATE,
  data_validade DATE NOT NULL,
  valor_tabela NUMERIC,
  valor_proposta NUMERIC,
  desconto_percentual NUMERIC,
  desconto_valor NUMERIC,
  valor_entrada NUMERIC,
  condicao_pagamento TEXT,
  observacoes TEXT,
  status proposta_status NOT NULL DEFAULT 'rascunho',
  motivo_recusa TEXT,
  data_aceite DATE,
  data_conversao DATE,
  contrato_id UUID,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela proposta_unidades (multi-select de unidades)
CREATE TABLE public.proposta_unidades (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  proposta_id UUID NOT NULL REFERENCES public.propostas(id) ON DELETE CASCADE,
  unidade_id UUID NOT NULL REFERENCES public.unidades(id),
  valor_tabela NUMERIC,
  valor_proposta NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela proposta_clientes (múltiplos clientes por proposta)
CREATE TABLE public.proposta_clientes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  proposta_id UUID NOT NULL REFERENCES public.propostas(id) ON DELETE CASCADE,
  cliente_id UUID NOT NULL REFERENCES public.clientes(id),
  tipo TEXT NOT NULL DEFAULT 'titular',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger para gerar número automático
CREATE OR REPLACE FUNCTION public.generate_proposta_numero()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.numero := 'PROP-' || LPAD(nextval('proposta_numero_seq')::TEXT, 5, '0');
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_proposta_numero
  BEFORE INSERT ON public.propostas
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_proposta_numero();

-- Trigger para updated_at
CREATE TRIGGER update_propostas_updated_at
  BEFORE UPDATE ON public.propostas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Função para verificar expiração automática
CREATE OR REPLACE FUNCTION public.check_proposta_expiracao()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Se proposta está enviada e passou da validade, expirar
  IF NEW.status = 'enviada' AND NEW.data_validade < CURRENT_DATE THEN
    NEW.status := 'expirada';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER auto_expire_proposta
  BEFORE UPDATE ON public.propostas
  FOR EACH ROW
  EXECUTE FUNCTION public.check_proposta_expiracao();

-- Função para gerenciar status das unidades
CREATE OR REPLACE FUNCTION public.manage_proposta_unidades_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Ao enviar proposta: reservar unidades
  IF NEW.status = 'enviada' AND (OLD.status IS NULL OR OLD.status = 'rascunho') THEN
    UPDATE public.unidades
    SET status = 'reservada'
    WHERE id IN (SELECT unidade_id FROM public.proposta_unidades WHERE proposta_id = NEW.id);
  
  -- Ao aceitar proposta: manter reservadas
  ELSIF NEW.status = 'aceita' AND OLD.status = 'enviada' THEN
    -- Unidades continuam reservadas até conversão
    NULL;
  
  -- Ao converter: marcar como vendida
  ELSIF NEW.status = 'convertida' AND OLD.status = 'aceita' THEN
    UPDATE public.unidades
    SET status = 'vendida'
    WHERE id IN (SELECT unidade_id FROM public.proposta_unidades WHERE proposta_id = NEW.id);
  
  -- Ao recusar ou expirar: liberar unidades
  ELSIF NEW.status IN ('recusada', 'expirada') AND OLD.status IN ('enviada', 'aceita') THEN
    UPDATE public.unidades
    SET status = 'disponivel'
    WHERE id IN (SELECT unidade_id FROM public.proposta_unidades WHERE proposta_id = NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER manage_proposta_unidades
  AFTER UPDATE ON public.propostas
  FOR EACH ROW
  EXECUTE FUNCTION public.manage_proposta_unidades_status();

-- Enable RLS
ALTER TABLE public.propostas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposta_unidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposta_clientes ENABLE ROW LEVEL SECURITY;

-- RLS Policies para propostas
CREATE POLICY "Admins can manage propostas"
  ON public.propostas FOR ALL
  USING (is_admin(auth.uid()));

CREATE POLICY "Gestores can manage propostas"
  ON public.propostas FOR ALL
  USING (has_role(auth.uid(), 'gestor_produto'));

CREATE POLICY "Corretores can create propostas"
  ON public.propostas FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Corretores can view own propostas"
  ON public.propostas FOR SELECT
  USING (
    corretor_id IN (
      SELECT c.id FROM corretores c
      JOIN profiles p ON p.email = c.email
      WHERE p.id = auth.uid()
    )
  );

CREATE POLICY "Corretores can update own propostas"
  ON public.propostas FOR UPDATE
  USING (
    corretor_id IN (
      SELECT c.id FROM corretores c
      JOIN profiles p ON p.email = c.email
      WHERE p.id = auth.uid()
    )
  );

-- RLS Policies para proposta_unidades
CREATE POLICY "Admins can manage proposta_unidades"
  ON public.proposta_unidades FOR ALL
  USING (is_admin(auth.uid()));

CREATE POLICY "Gestores can manage proposta_unidades"
  ON public.proposta_unidades FOR ALL
  USING (has_role(auth.uid(), 'gestor_produto'));

CREATE POLICY "Users can insert proposta_unidades"
  ON public.proposta_unidades FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can view proposta_unidades"
  ON public.proposta_unidades FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM propostas p
      WHERE p.id = proposta_unidades.proposta_id
        AND (
          is_admin(auth.uid())
          OR has_role(auth.uid(), 'gestor_produto')
          OR p.corretor_id IN (
            SELECT c.id FROM corretores c
            JOIN profiles pr ON pr.email = c.email
            WHERE pr.id = auth.uid()
          )
        )
    )
  );

-- RLS Policies para proposta_clientes
CREATE POLICY "Admins can manage proposta_clientes"
  ON public.proposta_clientes FOR ALL
  USING (is_admin(auth.uid()));

CREATE POLICY "Gestores can manage proposta_clientes"
  ON public.proposta_clientes FOR ALL
  USING (has_role(auth.uid(), 'gestor_produto'));

CREATE POLICY "Users can insert proposta_clientes"
  ON public.proposta_clientes FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can view proposta_clientes"
  ON public.proposta_clientes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM propostas p
      WHERE p.id = proposta_clientes.proposta_id
        AND (
          is_admin(auth.uid())
          OR has_role(auth.uid(), 'gestor_produto')
          OR p.corretor_id IN (
            SELECT c.id FROM corretores c
            JOIN profiles pr ON pr.email = c.email
            WHERE pr.id = auth.uid()
          )
        )
    )
  );

-- Índices para performance
CREATE INDEX idx_propostas_status ON public.propostas(status);
CREATE INDEX idx_propostas_data_validade ON public.propostas(data_validade);
CREATE INDEX idx_propostas_empreendimento ON public.propostas(empreendimento_id);
CREATE INDEX idx_propostas_corretor ON public.propostas(corretor_id);
CREATE INDEX idx_propostas_cliente ON public.propostas(cliente_id);
CREATE INDEX idx_proposta_unidades_proposta ON public.proposta_unidades(proposta_id);
CREATE INDEX idx_proposta_clientes_proposta ON public.proposta_clientes(proposta_id);