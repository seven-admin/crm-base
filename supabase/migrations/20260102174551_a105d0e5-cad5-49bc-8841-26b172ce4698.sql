-- =============================================
-- FASE 1: REESTRUTURAÇÃO DO BANCO DE DADOS
-- Fluxo de Solicitação de Reserva (Gatekeeper)
-- =============================================

-- 1.1 ALTERAÇÕES NA TABELA NEGOCIACOES
-- Novo campo para controle de aprovação (mantendo funis dinâmicos)
ALTER TABLE public.negociacoes 
ADD COLUMN IF NOT EXISTS status_aprovacao TEXT 
CHECK (status_aprovacao IS NULL OR status_aprovacao IN ('pendente', 'aprovada', 'rejeitada'));

-- Campos de controle temporal
ALTER TABLE public.negociacoes ADD COLUMN IF NOT EXISTS solicitada_em TIMESTAMPTZ;
ALTER TABLE public.negociacoes ADD COLUMN IF NOT EXISTS aprovada_em TIMESTAMPTZ;
ALTER TABLE public.negociacoes ADD COLUMN IF NOT EXISTS rejeitada_em TIMESTAMPTZ;
ALTER TABLE public.negociacoes ADD COLUMN IF NOT EXISTS motivo_rejeicao TEXT;

-- Campos financeiros mestre
ALTER TABLE public.negociacoes ADD COLUMN IF NOT EXISTS valor_total_fechamento NUMERIC;
ALTER TABLE public.negociacoes ADD COLUMN IF NOT EXISTS condicao_pagamento JSONB;
ALTER TABLE public.negociacoes ADD COLUMN IF NOT EXISTS indice_correcao TEXT DEFAULT 'INCC';

-- Auditoria
ALTER TABLE public.negociacoes ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.profiles(id);
ALTER TABLE public.negociacoes ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES public.profiles(id);

-- 1.2 ALTERAÇÕES NA TABELA NEGOCIACAO_UNIDADES
-- Garantir UNIQUE constraint para evitar duplicatas
ALTER TABLE public.negociacao_unidades 
DROP CONSTRAINT IF EXISTS unique_negociacao_unidade;

ALTER TABLE public.negociacao_unidades 
ADD CONSTRAINT unique_negociacao_unidade UNIQUE(negociacao_id, unidade_id);

-- 1.3 ALTERAÇÕES NA TABELA CONTRATO_SIGNATARIOS (Cônjuge)
ALTER TABLE public.contrato_signatarios ADD COLUMN IF NOT EXISTS tem_conjuge BOOLEAN DEFAULT false;
ALTER TABLE public.contrato_signatarios ADD COLUMN IF NOT EXISTS conjuge_nome TEXT;
ALTER TABLE public.contrato_signatarios ADD COLUMN IF NOT EXISTS conjuge_cpf TEXT;
ALTER TABLE public.contrato_signatarios ADD COLUMN IF NOT EXISTS conjuge_email TEXT;
ALTER TABLE public.contrato_signatarios ADD COLUMN IF NOT EXISTS regime_bens TEXT;

-- Função de validação de dados do cônjuge
CREATE OR REPLACE FUNCTION public.validate_conjuge_data()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.tem_conjuge = true AND (
    NEW.conjuge_nome IS NULL OR 
    NEW.conjuge_cpf IS NULL
  ) THEN
    RAISE EXCEPTION 'Dados do cônjuge são obrigatórios quando tem_conjuge é true';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger para validar cônjuge
DROP TRIGGER IF EXISTS trigger_validate_conjuge ON public.contrato_signatarios;
CREATE TRIGGER trigger_validate_conjuge
  BEFORE INSERT OR UPDATE ON public.contrato_signatarios
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_conjuge_data();

-- 1.4 ALTERAÇÕES NA TABELA COMISSOES (Estorno)
ALTER TABLE public.comissoes ADD COLUMN IF NOT EXISTS estornada BOOLEAN DEFAULT false;
ALTER TABLE public.comissoes ADD COLUMN IF NOT EXISTS data_estorno TIMESTAMPTZ;

-- Auditoria em comissoes
ALTER TABLE public.comissoes ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.profiles(id);
ALTER TABLE public.comissoes ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES public.profiles(id);

-- 1.5 AUDITORIA EM CONTRATOS
ALTER TABLE public.contratos ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.profiles(id);
ALTER TABLE public.contratos ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES public.profiles(id);

-- =============================================
-- FASE 2: FUNÇÕES RPC PARA APROVAÇÃO/REJEIÇÃO
-- =============================================

-- 2.1 Função para APROVAR solicitação
CREATE OR REPLACE FUNCTION public.aprovar_solicitacao_negociacao(
  p_negociacao_id UUID,
  p_gestor_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_unidades_indisponiveis TEXT[];
  v_negociacoes_conflitantes UUID[];
  v_unidade_ids UUID[];
  v_qtd_conflitantes INTEGER;
BEGIN
  -- 1. Buscar unidades da negociação
  SELECT array_agg(unidade_id) INTO v_unidade_ids
  FROM public.negociacao_unidades
  WHERE negociacao_id = p_negociacao_id;

  IF v_unidade_ids IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Nenhuma unidade vinculada a esta negociação'
    );
  END IF;

  -- 2. Validar se todas estão disponíveis
  SELECT array_agg(u.codigo) INTO v_unidades_indisponiveis
  FROM public.unidades u
  WHERE u.id = ANY(v_unidade_ids) AND u.status != 'disponivel';

  IF array_length(v_unidades_indisponiveis, 1) > 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Unidades indisponíveis: ' || array_to_string(v_unidades_indisponiveis, ', ')
    );
  END IF;

  -- 3. Reservar unidades
  UPDATE public.unidades 
  SET status = 'reservada'::unidade_status 
  WHERE id = ANY(v_unidade_ids);

  -- 4. Identificar negociações conflitantes (outras pendentes com mesmas unidades)
  SELECT array_agg(DISTINCT n.id) INTO v_negociacoes_conflitantes
  FROM public.negociacoes n
  JOIN public.negociacao_unidades nu ON nu.negociacao_id = n.id
  WHERE nu.unidade_id = ANY(v_unidade_ids)
    AND n.id != p_negociacao_id
    AND n.status_aprovacao = 'pendente';

  v_qtd_conflitantes := COALESCE(array_length(v_negociacoes_conflitantes, 1), 0);

  -- 5. Rejeitar automaticamente as conflitantes
  IF v_qtd_conflitantes > 0 THEN
    UPDATE public.negociacoes 
    SET status_aprovacao = 'rejeitada',
        rejeitada_em = NOW(),
        motivo_rejeicao = 'Unidade reservada em outra negociação (aprovação automática)',
        updated_by = p_gestor_id
    WHERE id = ANY(v_negociacoes_conflitantes);
  END IF;

  -- 6. Aprovar negociação atual
  UPDATE public.negociacoes 
  SET status_aprovacao = 'aprovada',
      aprovada_em = NOW(),
      updated_by = p_gestor_id
  WHERE id = p_negociacao_id;

  RETURN jsonb_build_object(
    'success', true,
    'conflitantes_rejeitadas', v_qtd_conflitantes,
    'unidades_reservadas', array_length(v_unidade_ids, 1)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2.2 Função para REJEITAR solicitação
CREATE OR REPLACE FUNCTION public.rejeitar_solicitacao_negociacao(
  p_negociacao_id UUID,
  p_motivo TEXT,
  p_gestor_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.negociacoes 
  SET status_aprovacao = 'rejeitada',
      rejeitada_em = NOW(),
      motivo_rejeicao = p_motivo,
      updated_by = p_gestor_id
  WHERE id = p_negociacao_id
    AND status_aprovacao = 'pendente';
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2.3 Trigger para liberar unidades quando negociação aprovada for cancelada
CREATE OR REPLACE FUNCTION public.liberar_unidades_negociacao_cancelada()
RETURNS TRIGGER AS $$
BEGIN
  -- Se negociação estava aprovada e agora foi rejeitada/cancelada
  IF OLD.status_aprovacao = 'aprovada' AND NEW.status_aprovacao = 'rejeitada' THEN
    UPDATE public.unidades 
    SET status = 'disponivel'::unidade_status
    WHERE id IN (
      SELECT unidade_id FROM public.negociacao_unidades 
      WHERE negociacao_id = NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trigger_liberar_unidades_cancelamento ON public.negociacoes;
CREATE TRIGGER trigger_liberar_unidades_cancelamento
  AFTER UPDATE ON public.negociacoes
  FOR EACH ROW
  WHEN (OLD.status_aprovacao IS DISTINCT FROM NEW.status_aprovacao)
  EXECUTE FUNCTION public.liberar_unidades_negociacao_cancelada();

-- =============================================
-- FASE 3: POLÍTICAS RLS ADICIONAIS
-- =============================================

-- 3.1 Corretores só podem criar negociações com status_aprovacao = 'pendente'
DROP POLICY IF EXISTS "Corretores insert pendente only" ON public.negociacoes;
CREATE POLICY "Corretores insert pendente only" ON public.negociacoes
FOR INSERT TO authenticated
WITH CHECK (
  status_aprovacao = 'pendente' 
  OR status_aprovacao IS NULL
  OR is_admin(auth.uid())
  OR has_role(auth.uid(), 'gestor_produto'::app_role)
);

-- 3.2 Gestores podem atualizar status de aprovação
DROP POLICY IF EXISTS "Gestores update aprovacao" ON public.negociacoes;
CREATE POLICY "Gestores update aprovacao" ON public.negociacoes
FOR UPDATE TO authenticated
USING (
  is_admin(auth.uid()) 
  OR has_role(auth.uid(), 'gestor_produto'::app_role)
  OR user_has_empreendimento_access(auth.uid(), empreendimento_id)
);

-- 3.3 Gestores podem remover itens de solicitação pendente
DROP POLICY IF EXISTS "Gestores delete itens pendentes" ON public.negociacao_unidades;
CREATE POLICY "Gestores delete itens pendentes" ON public.negociacao_unidades
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.negociacoes n
    WHERE n.id = negociacao_id
    AND (n.status_aprovacao = 'pendente' OR n.status_aprovacao IS NULL)
    AND (is_admin(auth.uid()) OR has_role(auth.uid(), 'gestor_produto'::app_role))
  )
);