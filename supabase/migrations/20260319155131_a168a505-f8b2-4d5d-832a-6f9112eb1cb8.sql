CREATE OR REPLACE FUNCTION public.verificar_ficha_proposta_completa(neg_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_negociacao RECORD;
  v_cliente RECORD;
  v_tem_unidades boolean;
  v_tem_condicoes boolean;
BEGIN
  SELECT * INTO v_negociacao FROM public.negociacoes WHERE id = neg_id;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  IF v_negociacao.cliente_id IS NULL THEN
    RETURN false;
  END IF;
  
  SELECT * INTO v_cliente FROM public.clientes WHERE id = v_negociacao.cliente_id;
  
  IF v_cliente.nome IS NULL OR v_cliente.cpf IS NULL OR v_cliente.email IS NULL THEN
    RETURN false;
  END IF;
  
  IF v_cliente.estado_civil IS NULL THEN
    RETURN false;
  END IF;
  
  SELECT EXISTS(
    SELECT 1 FROM public.negociacao_unidades WHERE negociacao_id = neg_id
  ) INTO v_tem_unidades;
  
  IF NOT v_tem_unidades THEN
    RETURN false;
  END IF;
  
  SELECT EXISTS(
    SELECT 1 FROM public.negociacao_condicoes_pagamento WHERE negociacao_id = neg_id
  ) INTO v_tem_condicoes;
  
  IF NOT v_tem_condicoes THEN
    RETURN false;
  END IF;
  
  IF v_negociacao.valor_negociacao IS NULL OR v_negociacao.valor_negociacao <= 0 THEN
    RETURN false;
  END IF;
  
  RETURN true;
END;
$function$;