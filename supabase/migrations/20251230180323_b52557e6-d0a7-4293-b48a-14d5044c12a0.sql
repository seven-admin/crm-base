-- =====================================================
-- ETAPA 8: FINANCEIRO PÓS-VENDA (CORRIGIDO)
-- =====================================================

-- Create sequence for comissao numbering
CREATE SEQUENCE IF NOT EXISTS comissao_numero_seq START 1;

-- Create enum for comissao status
CREATE TYPE comissao_status AS ENUM ('pendente', 'parcialmente_pago', 'pago', 'cancelado');

-- Create enum for parcela status
CREATE TYPE parcela_status AS ENUM ('pendente', 'paga', 'atrasada', 'cancelada');

-- =====================================================
-- TABLE: configuracao_comissoes
-- =====================================================
CREATE TABLE public.configuracao_comissoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empreendimento_id UUID REFERENCES public.empreendimentos(id) ON DELETE CASCADE,
  percentual_padrao_corretor NUMERIC(5, 2) DEFAULT 3.00,
  percentual_padrao_imobiliaria NUMERIC(5, 2) DEFAULT 5.00,
  regra_calculo TEXT DEFAULT 'valor_venda',
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_empreendimento_config UNIQUE (empreendimento_id)
);

-- =====================================================
-- TABLE: comissoes
-- =====================================================
CREATE TABLE public.comissoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero TEXT NOT NULL,
  contrato_id UUID REFERENCES public.contratos(id) ON DELETE SET NULL,
  proposta_id UUID REFERENCES public.propostas(id) ON DELETE SET NULL,
  empreendimento_id UUID NOT NULL REFERENCES public.empreendimentos(id) ON DELETE RESTRICT,
  corretor_id UUID REFERENCES public.corretores(id) ON DELETE SET NULL,
  imobiliaria_id UUID REFERENCES public.imobiliarias(id) ON DELETE SET NULL,
  
  -- Valores
  valor_venda NUMERIC(15, 2) NOT NULL,
  percentual_corretor NUMERIC(5, 2) DEFAULT 0,
  valor_corretor NUMERIC(15, 2) DEFAULT 0,
  percentual_imobiliaria NUMERIC(5, 2) DEFAULT 0,
  valor_imobiliaria NUMERIC(15, 2) DEFAULT 0,
  
  -- Status
  status_corretor comissao_status NOT NULL DEFAULT 'pendente',
  status_imobiliaria comissao_status NOT NULL DEFAULT 'pendente',
  
  -- Datas de pagamento
  data_pagamento_corretor DATE,
  data_pagamento_imobiliaria DATE,
  
  -- Notas fiscais
  nf_corretor TEXT,
  nf_imobiliaria TEXT,
  
  -- Metadata
  observacoes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Function to generate comissao numero
CREATE OR REPLACE FUNCTION generate_comissao_numero()
RETURNS TRIGGER AS $$
BEGIN
  NEW.numero := 'COM-' || LPAD(nextval('comissao_numero_seq')::TEXT, 5, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for auto-numbering
CREATE TRIGGER set_comissao_numero
  BEFORE INSERT ON public.comissoes
  FOR EACH ROW
  EXECUTE FUNCTION generate_comissao_numero();

-- =====================================================
-- TABLE: comissao_parcelas
-- =====================================================
CREATE TABLE public.comissao_parcelas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comissao_id UUID NOT NULL REFERENCES public.comissoes(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('corretor', 'imobiliaria')),
  parcela INTEGER NOT NULL,
  valor NUMERIC(15, 2) NOT NULL,
  data_vencimento DATE NOT NULL,
  data_pagamento DATE,
  status parcela_status NOT NULL DEFAULT 'pendente',
  comprovante_url TEXT,
  observacao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- TRIGGERS FOR updated_at
-- =====================================================
CREATE TRIGGER update_configuracao_comissoes_updated_at
  BEFORE UPDATE ON public.configuracao_comissoes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comissoes_updated_at
  BEFORE UPDATE ON public.comissoes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comissao_parcelas_updated_at
  BEFORE UPDATE ON public.comissao_parcelas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE public.configuracao_comissoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comissoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comissao_parcelas ENABLE ROW LEVEL SECURITY;

-- Configuracao Comissoes policies
CREATE POLICY "Admins can manage configuracao_comissoes" ON public.configuracao_comissoes
  FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Gestores can manage configuracao_comissoes" ON public.configuracao_comissoes
  FOR ALL USING (has_role(auth.uid(), 'gestor_produto'));

CREATE POLICY "Users can view configuracao_comissoes" ON public.configuracao_comissoes
  FOR SELECT USING (user_has_empreendimento_access(auth.uid(), empreendimento_id));

-- Comissoes policies
CREATE POLICY "Admins can manage comissoes" ON public.comissoes
  FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Gestores can manage comissoes" ON public.comissoes
  FOR ALL USING (has_role(auth.uid(), 'gestor_produto'));

CREATE POLICY "Corretores can view own comissoes" ON public.comissoes
  FOR SELECT USING (
    corretor_id IN (
      SELECT c.id FROM corretores c
      JOIN profiles p ON p.email = c.email
      WHERE p.id = auth.uid()
    )
  );

-- Comissao Parcelas policies
CREATE POLICY "Admins can manage comissao_parcelas" ON public.comissao_parcelas
  FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Gestores can manage comissao_parcelas" ON public.comissao_parcelas
  FOR ALL USING (has_role(auth.uid(), 'gestor_produto'));

CREATE POLICY "Users can view comissao_parcelas" ON public.comissao_parcelas
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM comissoes c
      WHERE c.id = comissao_parcelas.comissao_id
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

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX idx_comissoes_contrato ON public.comissoes(contrato_id);
CREATE INDEX idx_comissoes_proposta ON public.comissoes(proposta_id);
CREATE INDEX idx_comissoes_empreendimento ON public.comissoes(empreendimento_id);
CREATE INDEX idx_comissoes_corretor ON public.comissoes(corretor_id);
CREATE INDEX idx_comissoes_imobiliaria ON public.comissoes(imobiliaria_id);
CREATE INDEX idx_comissoes_status_corretor ON public.comissoes(status_corretor);
CREATE INDEX idx_comissoes_status_imobiliaria ON public.comissoes(status_imobiliaria);
CREATE INDEX idx_comissao_parcelas_comissao ON public.comissao_parcelas(comissao_id);
CREATE INDEX idx_comissao_parcelas_status ON public.comissao_parcelas(status);
CREATE INDEX idx_comissao_parcelas_vencimento ON public.comissao_parcelas(data_vencimento);

-- =====================================================
-- INSERT MODULE FOR PERMISSIONS
-- =====================================================
INSERT INTO public.modules (name, display_name, description, icon, route, is_active)
VALUES 
  ('contratos', 'Contratos', 'Gestão de contratos comerciais', 'FileSignature', '/contratos', true),
  ('comissoes', 'Comissões', 'Controle de comissões e pagamentos', 'DollarSign', '/comissoes', true),
  ('relatorios_financeiros', 'Relatórios Financeiros', 'Relatórios financeiros e análises', 'BarChart3', '/relatorios-financeiros', true)
ON CONFLICT DO NOTHING;

-- Grant default permissions to admin and gestor_produto (using 'global' scope)
INSERT INTO public.role_permissions (role, module_id, can_view, can_create, can_edit, can_delete, scope)
SELECT 'admin', m.id, true, true, true, true, 'global'
FROM public.modules m 
WHERE m.name IN ('contratos', 'comissoes', 'relatorios_financeiros')
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role, module_id, can_view, can_create, can_edit, can_delete, scope)
SELECT 'gestor_produto', m.id, true, true, true, true, 'global'
FROM public.modules m 
WHERE m.name IN ('contratos', 'comissoes', 'relatorios_financeiros')
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role, module_id, can_view, can_create, can_edit, can_delete, scope)
SELECT 'corretor', m.id, true, true, false, false, 'proprio'
FROM public.modules m 
WHERE m.name = 'contratos'
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role, module_id, can_view, can_create, can_edit, can_delete, scope)
SELECT 'corretor', m.id, true, false, false, false, 'proprio'
FROM public.modules m 
WHERE m.name = 'comissoes'
ON CONFLICT DO NOTHING;