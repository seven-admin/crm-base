
-- =============================================
-- 1. CORRETORES: imobiliaria_id nullable + status_vinculo
-- =============================================
ALTER TABLE public.corretores ALTER COLUMN imobiliaria_id DROP NOT NULL;

ALTER TABLE public.corretores ADD COLUMN IF NOT EXISTS status_vinculo text DEFAULT 'ativo';

-- =============================================
-- 2. CLIENTES: tipo_pessoa, cnpj, razao_social, inscricao_estadual
-- =============================================
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS tipo_pessoa text DEFAULT 'fisica';
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS cnpj text;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS razao_social text;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS inscricao_estadual text;

-- =============================================
-- 3. Atualizar trigger uppercase_clientes para incluir razao_social
-- =============================================
CREATE OR REPLACE FUNCTION public.uppercase_clientes()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.email IS NOT NULL THEN NEW.email = LOWER(NEW.email); END IF;
  IF NEW.nome IS NOT NULL THEN NEW.nome = UPPER(NEW.nome); END IF;
  IF NEW.razao_social IS NOT NULL THEN NEW.razao_social = UPPER(NEW.razao_social); END IF;
  IF NEW.endereco_logradouro IS NOT NULL THEN NEW.endereco_logradouro = UPPER(NEW.endereco_logradouro); END IF;
  IF NEW.endereco_bairro IS NOT NULL THEN NEW.endereco_bairro = UPPER(NEW.endereco_bairro); END IF;
  IF NEW.endereco_cidade IS NOT NULL THEN NEW.endereco_cidade = UPPER(NEW.endereco_cidade); END IF;
  IF NEW.endereco_complemento IS NOT NULL THEN NEW.endereco_complemento = UPPER(NEW.endereco_complemento); END IF;
  IF NEW.endereco_uf IS NOT NULL THEN NEW.endereco_uf = UPPER(NEW.endereco_uf); END IF;
  IF NEW.nome_mae IS NOT NULL THEN NEW.nome_mae = UPPER(NEW.nome_mae); END IF;
  IF NEW.nome_pai IS NOT NULL THEN NEW.nome_pai = UPPER(NEW.nome_pai); END IF;
  IF NEW.profissao IS NOT NULL THEN NEW.profissao = UPPER(NEW.profissao); END IF;
  IF NEW.nacionalidade IS NOT NULL THEN NEW.nacionalidade = UPPER(NEW.nacionalidade); END IF;
  RETURN NEW;
END;
$function$;

-- =============================================
-- 4. Atualizar verificar_ficha_proposta_completa para tipo_pessoa
-- =============================================
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
  
  -- Validação de documento conforme tipo_pessoa
  IF COALESCE(v_cliente.tipo_pessoa, 'fisica') = 'juridica' THEN
    -- PJ: exigir CNPJ
    IF v_cliente.cnpj IS NULL THEN
      RETURN false;
    END IF;
  ELSE
    -- PF: verificar nacionalidade
    IF v_cliente.nacionalidade IS NOT NULL 
       AND UPPER(v_cliente.nacionalidade) NOT LIKE '%BRASIL%' 
       AND UPPER(v_cliente.nacionalidade) NOT IN ('BRASILEIRO', 'BRASILEIRA') THEN
      -- Estrangeiro: exigir passaporte
      IF v_cliente.passaporte IS NULL THEN
        RETURN false;
      END IF;
    ELSE
      -- Brasileiro: exigir CPF
      IF v_cliente.cpf IS NULL THEN
        RETURN false;
      END IF;
    END IF;
  END IF;
  
  IF v_cliente.nome IS NULL OR v_cliente.email IS NULL THEN
    RETURN false;
  END IF;
  
  -- Estado civil apenas para PF
  IF COALESCE(v_cliente.tipo_pessoa, 'fisica') = 'fisica' AND v_cliente.estado_civil IS NULL THEN
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

-- =============================================
-- 5. RPC pública para listar imobiliárias ativas (autocadastro)
-- =============================================
CREATE OR REPLACE FUNCTION public.get_imobiliarias_ativas()
 RETURNS TABLE(id uuid, nome text, endereco_cidade text, endereco_uf text)
 LANGUAGE sql
 STABLE
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT i.id, i.nome, i.endereco_cidade, i.endereco_uf
  FROM public.imobiliarias i
  WHERE i.is_active = true
  ORDER BY i.nome;
$function$;
