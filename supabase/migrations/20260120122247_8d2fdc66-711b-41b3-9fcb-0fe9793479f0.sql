-- Fase 1: Adicionar campos de validação à tabela negociacoes
-- Os campos de validação controlam se a ficha de proposta está completa

-- Campos de validação da ficha de proposta
ALTER TABLE public.negociacoes 
ADD COLUMN IF NOT EXISTS ficha_completa boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS documentos_anexados boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS dados_filiacao_ok boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS estado_civil_validado boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS validacao_comercial_em timestamp with time zone,
ADD COLUMN IF NOT EXISTS validacao_comercial_por uuid REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS motivo_validacao text;

-- Criar função para verificar se a ficha está completa
CREATE OR REPLACE FUNCTION public.verificar_ficha_proposta_completa(neg_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_negociacao RECORD;
  v_cliente RECORD;
  v_tem_unidades boolean;
  v_tem_condicoes boolean;
BEGIN
  -- Buscar dados da negociação
  SELECT * INTO v_negociacao FROM public.negociacoes WHERE id = neg_id;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Verificar se tem cliente vinculado
  IF v_negociacao.cliente_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Buscar dados do cliente
  SELECT * INTO v_cliente FROM public.clientes WHERE id = v_negociacao.cliente_id;
  
  -- Verificar campos obrigatórios do cliente
  IF v_cliente.nome IS NULL OR v_cliente.cpf IS NULL OR v_cliente.email IS NULL THEN
    RETURN false;
  END IF;
  
  -- Verificar estado civil
  IF v_cliente.estado_civil IS NULL THEN
    RETURN false;
  END IF;
  
  -- Verificar se tem unidades
  SELECT EXISTS(
    SELECT 1 FROM public.negociacao_unidades WHERE negociacao_id = neg_id
  ) INTO v_tem_unidades;
  
  IF NOT v_tem_unidades THEN
    RETURN false;
  END IF;
  
  -- Verificar se tem condições de pagamento
  SELECT EXISTS(
    SELECT 1 FROM public.negociacao_condicoes_pagamento WHERE negociacao_id = neg_id
  ) INTO v_tem_condicoes;
  
  IF NOT v_tem_condicoes THEN
    RETURN false;
  END IF;
  
  -- Verificar valor total
  IF v_negociacao.valor_total IS NULL OR v_negociacao.valor_total <= 0 THEN
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$;

-- Trigger para atualizar ficha_completa automaticamente
CREATE OR REPLACE FUNCTION public.atualizar_ficha_completa()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  NEW.ficha_completa := public.verificar_ficha_proposta_completa(NEW.id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_atualizar_ficha_completa ON public.negociacoes;
CREATE TRIGGER trigger_atualizar_ficha_completa
BEFORE UPDATE ON public.negociacoes
FOR EACH ROW
EXECUTE FUNCTION public.atualizar_ficha_completa();