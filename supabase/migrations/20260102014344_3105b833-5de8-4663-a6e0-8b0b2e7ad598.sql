-- =====================================================
-- FASE 1: Unificar Negociação e Proposta
-- Adicionar campos de proposta na tabela negociacoes
-- =====================================================

-- 1.1 Adicionar colunas de proposta na tabela negociacoes
ALTER TABLE public.negociacoes 
ADD COLUMN IF NOT EXISTS numero_proposta TEXT,
ADD COLUMN IF NOT EXISTS status_proposta TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS data_emissao_proposta DATE,
ADD COLUMN IF NOT EXISTS data_validade_proposta DATE,
ADD COLUMN IF NOT EXISTS valor_tabela NUMERIC,
ADD COLUMN IF NOT EXISTS valor_proposta NUMERIC,
ADD COLUMN IF NOT EXISTS desconto_percentual NUMERIC,
ADD COLUMN IF NOT EXISTS desconto_valor NUMERIC,
ADD COLUMN IF NOT EXISTS motivo_recusa TEXT,
ADD COLUMN IF NOT EXISTS data_aceite DATE,
ADD COLUMN IF NOT EXISTS data_conversao DATE,
ADD COLUMN IF NOT EXISTS contrato_id UUID REFERENCES public.contratos(id),
ADD COLUMN IF NOT EXISTS simulacao_dados JSONB;

-- 1.2 Expandir tabela negociacao_unidades com valores de proposta
ALTER TABLE public.negociacao_unidades
ADD COLUMN IF NOT EXISTS valor_tabela NUMERIC,
ADD COLUMN IF NOT EXISTS valor_proposta NUMERIC;

-- 1.3 Criar tabela para múltiplos clientes na negociação
CREATE TABLE IF NOT EXISTS public.negociacao_clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  negociacao_id UUID NOT NULL REFERENCES public.negociacoes(id) ON DELETE CASCADE,
  cliente_id UUID NOT NULL REFERENCES public.clientes(id),
  tipo TEXT NOT NULL DEFAULT 'titular',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 1.4 Criar sequence para número de proposta
CREATE SEQUENCE IF NOT EXISTS public.negociacao_proposta_seq START 1;

-- 1.5 Criar função para gerar número de proposta
CREATE OR REPLACE FUNCTION public.generate_negociacao_proposta_numero()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN 'PROP-' || LPAD(nextval('negociacao_proposta_seq')::TEXT, 5, '0');
END;
$$;

-- 1.6 Criar trigger para verificar expiração de proposta
CREATE OR REPLACE FUNCTION public.check_negociacao_proposta_expiracao()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Se proposta está enviada e passou da validade, expirar
  IF NEW.status_proposta = 'enviada' AND NEW.data_validade_proposta < CURRENT_DATE THEN
    NEW.status_proposta := 'expirada';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER check_negociacao_proposta_expiracao_trigger
BEFORE UPDATE ON public.negociacoes
FOR EACH ROW
EXECUTE FUNCTION public.check_negociacao_proposta_expiracao();

-- 1.7 Criar trigger para gerenciar status das unidades baseado na proposta
CREATE OR REPLACE FUNCTION public.manage_negociacao_proposta_unidades_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Ao enviar proposta: reservar unidades
  IF NEW.status_proposta = 'enviada' AND (OLD.status_proposta IS NULL OR OLD.status_proposta = 'rascunho') THEN
    UPDATE public.unidades
    SET status = 'reservada'
    WHERE id IN (SELECT unidade_id FROM public.negociacao_unidades WHERE negociacao_id = NEW.id);
  
  -- Ao converter: marcar como vendida
  ELSIF NEW.status_proposta = 'convertida' AND OLD.status_proposta = 'aceita' THEN
    UPDATE public.unidades
    SET status = 'vendida'
    WHERE id IN (SELECT unidade_id FROM public.negociacao_unidades WHERE negociacao_id = NEW.id);
  
  -- Ao recusar ou expirar: liberar unidades
  ELSIF NEW.status_proposta IN ('recusada', 'expirada') AND OLD.status_proposta IN ('enviada', 'aceita') THEN
    UPDATE public.unidades
    SET status = 'disponivel'
    WHERE id IN (SELECT unidade_id FROM public.negociacao_unidades WHERE negociacao_id = NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER manage_negociacao_proposta_unidades_status_trigger
AFTER UPDATE ON public.negociacoes
FOR EACH ROW
EXECUTE FUNCTION public.manage_negociacao_proposta_unidades_status();

-- 1.8 Habilitar RLS na nova tabela
ALTER TABLE public.negociacao_clientes ENABLE ROW LEVEL SECURITY;

-- 1.9 Criar policies para negociacao_clientes
CREATE POLICY "Admins can manage negociacao_clientes"
ON public.negociacao_clientes
FOR ALL
USING (is_admin(auth.uid()));

CREATE POLICY "Gestores can manage negociacao_clientes"
ON public.negociacao_clientes
FOR ALL
USING (has_role(auth.uid(), 'gestor_produto'::app_role));

CREATE POLICY "Users can view negociacao_clientes"
ON public.negociacao_clientes
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.negociacoes n
    WHERE n.id = negociacao_clientes.negociacao_id
    AND (
      is_admin(auth.uid()) OR
      has_role(auth.uid(), 'gestor_produto'::app_role) OR
      n.corretor_id IN (
        SELECT c.id FROM public.corretores c
        JOIN public.profiles p ON p.email = c.email
        WHERE p.id = auth.uid()
      )
    )
  )
);

CREATE POLICY "Users can insert negociacao_clientes"
ON public.negociacao_clientes
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can update negociacao_clientes"
ON public.negociacao_clientes
FOR UPDATE
USING (true);

-- 1.10 Índices para performance
CREATE INDEX IF NOT EXISTS idx_negociacoes_status_proposta ON public.negociacoes(status_proposta);
CREATE INDEX IF NOT EXISTS idx_negociacoes_data_validade_proposta ON public.negociacoes(data_validade_proposta);
CREATE INDEX IF NOT EXISTS idx_negociacoes_contrato_id ON public.negociacoes(contrato_id);
CREATE INDEX IF NOT EXISTS idx_negociacao_clientes_negociacao_id ON public.negociacao_clientes(negociacao_id);
CREATE INDEX IF NOT EXISTS idx_negociacao_clientes_cliente_id ON public.negociacao_clientes(cliente_id);