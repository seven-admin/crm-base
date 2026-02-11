-- Enum para tipos de signatário
CREATE TYPE public.signatario_tipo AS ENUM (
  'comprador',
  'conjuge', 
  'testemunha_1',
  'testemunha_2',
  'representante_legal',
  'incorporador'
);

-- Enum para status de assinatura
CREATE TYPE public.signatario_status AS ENUM (
  'pendente',
  'enviado',
  'visualizado',
  'assinado',
  'recusado'
);

-- Enum para tipos de aprovador
CREATE TYPE public.aprovador_tipo AS ENUM (
  'corretor',
  'gestor_comercial',
  'juridico',
  'diretoria',
  'incorporador'
);

-- Enum para status de aprovação
CREATE TYPE public.aprovacao_status AS ENUM (
  'pendente',
  'aprovado',
  'reprovado',
  'em_revisao'
);

-- Tabela de signatários do contrato
CREATE TABLE public.contrato_signatarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contrato_id UUID NOT NULL REFERENCES public.contratos(id) ON DELETE CASCADE,
  tipo signatario_tipo NOT NULL,
  nome TEXT NOT NULL,
  email TEXT,
  telefone TEXT,
  cpf TEXT,
  ordem INTEGER NOT NULL DEFAULT 1,
  obrigatorio BOOLEAN NOT NULL DEFAULT true,
  status signatario_status NOT NULL DEFAULT 'pendente',
  data_envio TIMESTAMPTZ,
  data_visualizacao TIMESTAMPTZ,
  data_assinatura TIMESTAMPTZ,
  ip_assinatura TEXT,
  user_agent TEXT,
  motivo_recusa TEXT,
  token_assinatura TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de aprovações do contrato
CREATE TABLE public.contrato_aprovacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contrato_id UUID NOT NULL REFERENCES public.contratos(id) ON DELETE CASCADE,
  etapa INTEGER NOT NULL DEFAULT 1,
  tipo_aprovador aprovador_tipo NOT NULL,
  aprovador_id UUID REFERENCES public.profiles(id),
  status aprovacao_status NOT NULL DEFAULT 'pendente',
  observacao TEXT,
  data_envio TIMESTAMPTZ,
  data_resposta TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de configuração do fluxo de aprovação
CREATE TABLE public.fluxo_aprovacao_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empreendimento_id UUID REFERENCES public.empreendimentos(id) ON DELETE CASCADE,
  etapa INTEGER NOT NULL,
  tipo_aprovador aprovador_tipo NOT NULL,
  nome_etapa TEXT NOT NULL,
  obrigatoria BOOLEAN NOT NULL DEFAULT true,
  prazo_horas INTEGER DEFAULT 48,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(empreendimento_id, etapa)
);

-- Indexes
CREATE INDEX idx_contrato_signatarios_contrato ON public.contrato_signatarios(contrato_id);
CREATE INDEX idx_contrato_signatarios_token ON public.contrato_signatarios(token_assinatura);
CREATE INDEX idx_contrato_signatarios_status ON public.contrato_signatarios(status);
CREATE INDEX idx_contrato_aprovacoes_contrato ON public.contrato_aprovacoes(contrato_id);
CREATE INDEX idx_contrato_aprovacoes_aprovador ON public.contrato_aprovacoes(aprovador_id);
CREATE INDEX idx_fluxo_aprovacao_config_empreendimento ON public.fluxo_aprovacao_config(empreendimento_id);

-- Enable RLS
ALTER TABLE public.contrato_signatarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contrato_aprovacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fluxo_aprovacao_config ENABLE ROW LEVEL SECURITY;

-- RLS Policies for contrato_signatarios
CREATE POLICY "Admins can manage contrato_signatarios"
ON public.contrato_signatarios FOR ALL
USING (is_admin(auth.uid()));

CREATE POLICY "Gestores can manage contrato_signatarios"
ON public.contrato_signatarios FOR ALL
USING (has_role(auth.uid(), 'gestor_produto'));

CREATE POLICY "Users can view contrato_signatarios"
ON public.contrato_signatarios FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM contratos c
    WHERE c.id = contrato_signatarios.contrato_id
    AND (
      is_admin(auth.uid()) OR
      has_role(auth.uid(), 'gestor_produto') OR
      c.corretor_id IN (
        SELECT cor.id FROM corretores cor
        JOIN profiles p ON p.email = cor.email
        WHERE p.id = auth.uid()
      )
    )
  )
);

CREATE POLICY "Users can insert contrato_signatarios"
ON public.contrato_signatarios FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can update contrato_signatarios"
ON public.contrato_signatarios FOR UPDATE
USING (true);

-- RLS Policies for contrato_aprovacoes
CREATE POLICY "Admins can manage contrato_aprovacoes"
ON public.contrato_aprovacoes FOR ALL
USING (is_admin(auth.uid()));

CREATE POLICY "Gestores can manage contrato_aprovacoes"
ON public.contrato_aprovacoes FOR ALL
USING (has_role(auth.uid(), 'gestor_produto'));

CREATE POLICY "Users can view contrato_aprovacoes"
ON public.contrato_aprovacoes FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM contratos c
    WHERE c.id = contrato_aprovacoes.contrato_id
    AND (
      is_admin(auth.uid()) OR
      has_role(auth.uid(), 'gestor_produto') OR
      c.corretor_id IN (
        SELECT cor.id FROM corretores cor
        JOIN profiles p ON p.email = cor.email
        WHERE p.id = auth.uid()
      )
    )
  )
);

CREATE POLICY "Aprovadores can update own aprovacoes"
ON public.contrato_aprovacoes FOR UPDATE
USING (aprovador_id = auth.uid());

CREATE POLICY "Users can insert contrato_aprovacoes"
ON public.contrato_aprovacoes FOR INSERT
WITH CHECK (true);

-- RLS Policies for fluxo_aprovacao_config
CREATE POLICY "Admins can manage fluxo_aprovacao_config"
ON public.fluxo_aprovacao_config FOR ALL
USING (is_admin(auth.uid()));

CREATE POLICY "Gestores can manage fluxo_aprovacao_config"
ON public.fluxo_aprovacao_config FOR ALL
USING (has_role(auth.uid(), 'gestor_produto'));

CREATE POLICY "Users can view fluxo_aprovacao_config"
ON public.fluxo_aprovacao_config FOR SELECT
USING (is_active = true);

-- Triggers for updated_at
CREATE TRIGGER update_contrato_signatarios_updated_at
BEFORE UPDATE ON public.contrato_signatarios
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_contrato_aprovacoes_updated_at
BEFORE UPDATE ON public.contrato_aprovacoes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_fluxo_aprovacao_config_updated_at
BEFORE UPDATE ON public.fluxo_aprovacao_config
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to generate secure token for signature
CREATE OR REPLACE FUNCTION public.generate_signature_token()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'hex');
END;
$$;

-- Insert default global approval flow configuration
INSERT INTO public.fluxo_aprovacao_config (empreendimento_id, etapa, tipo_aprovador, nome_etapa, obrigatoria, prazo_horas)
VALUES
  (NULL, 1, 'corretor', 'Validação do Corretor', true, 24),
  (NULL, 2, 'gestor_comercial', 'Aprovação Comercial', true, 48),
  (NULL, 3, 'juridico', 'Análise Jurídica', true, 72),
  (NULL, 4, 'incorporador', 'Aprovação Final', true, 48);