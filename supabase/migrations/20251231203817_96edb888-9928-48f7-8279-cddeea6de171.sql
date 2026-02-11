-- Tabela de tipos de parcela (referência)
CREATE TABLE public.tipos_parcela (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo text UNIQUE NOT NULL,
  nome text NOT NULL,
  descricao text,
  ordem integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Dados iniciais
INSERT INTO public.tipos_parcela (codigo, nome, descricao, ordem) VALUES
  ('entrada', 'Parcela de Entrada', 'Valor pago no ato da assinatura', 1),
  ('mensal_fixa', 'Parcela Mensal Fixa', 'Parcela única com valor fixo', 2),
  ('mensal_serie', 'Série de Parcelas Mensais', 'Parcelas mensais iguais e sucessivas', 3),
  ('intermediaria', 'Parcela Intermediária (Balão)', 'Parcela de valor maior em data específica', 4),
  ('residual', 'Parcela Residual Final', 'Saldo restante a ser pago', 5),
  ('corretagem', 'Corretagem', 'Valor de corretagem imobiliária', 6);

-- Enable RLS
ALTER TABLE public.tipos_parcela ENABLE ROW LEVEL SECURITY;

-- RLS: Anyone can view active tipos_parcela
CREATE POLICY "Anyone can view active tipos_parcela"
ON public.tipos_parcela FOR SELECT
USING (is_active = true);

-- RLS: Admins can manage tipos_parcela
CREATE POLICY "Admins can manage tipos_parcela"
ON public.tipos_parcela FOR ALL
USING (is_admin(auth.uid()));

-- Tabela de condições de pagamento do template
CREATE TABLE public.template_condicoes_pagamento (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES public.contrato_templates(id) ON DELETE CASCADE,
  tipo_parcela_codigo text NOT NULL,
  ordem integer DEFAULT 0,
  descricao text,
  
  -- Valores
  quantidade integer DEFAULT 1,
  valor numeric,
  valor_tipo text DEFAULT 'fixo' CHECK (valor_tipo IN ('fixo', 'percentual')),
  
  -- Datas
  data_vencimento date,
  intervalo_dias integer DEFAULT 30,
  evento_vencimento text CHECK (evento_vencimento IN ('assinatura', 'habite_se', 'entrega_chaves', 'custom')),
  
  -- Correção monetária
  com_correcao boolean DEFAULT false,
  indice_correcao text DEFAULT 'INCC',
  parcelas_sem_correcao integer DEFAULT 0,
  
  -- Forma de quitação
  forma_quitacao text DEFAULT 'dinheiro' CHECK (forma_quitacao IN ('dinheiro', 'veiculo', 'imovel', 'outro_bem')),
  forma_pagamento text DEFAULT 'boleto' CHECK (forma_pagamento IN ('boleto', 'ted', 'pix', 'cheque', 'nota_fiscal')),
  
  -- Dados do bem (quando forma_quitacao != 'dinheiro')
  bem_descricao text,
  bem_marca text,
  bem_modelo text,
  bem_ano text,
  bem_placa text,
  bem_cor text,
  bem_renavam text,
  bem_matricula text,
  bem_cartorio text,
  bem_endereco text,
  bem_area_m2 numeric,
  bem_valor_avaliado numeric,
  bem_observacoes text,
  
  -- Corretagem
  beneficiario_tipo text CHECK (beneficiario_tipo IN ('imobiliaria', 'corretor')),
  beneficiario_id uuid,
  
  -- Texto adicional
  observacao_texto text,
  
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.template_condicoes_pagamento ENABLE ROW LEVEL SECURITY;

-- RLS policies for template_condicoes_pagamento
CREATE POLICY "Admins can manage template_condicoes_pagamento"
ON public.template_condicoes_pagamento FOR ALL
USING (is_admin(auth.uid()));

CREATE POLICY "Gestores can manage template_condicoes_pagamento"
ON public.template_condicoes_pagamento FOR ALL
USING (has_role(auth.uid(), 'gestor_produto'::app_role));

CREATE POLICY "Users can view template_condicoes_pagamento"
ON public.template_condicoes_pagamento FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.contrato_templates t
  WHERE t.id = template_condicoes_pagamento.template_id
  AND t.is_active = true
));

-- Tabela de condições de pagamento do contrato (cópia customizável)
CREATE TABLE public.contrato_condicoes_pagamento (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contrato_id uuid NOT NULL REFERENCES public.contratos(id) ON DELETE CASCADE,
  tipo_parcela_codigo text NOT NULL,
  ordem integer DEFAULT 0,
  descricao text,
  
  -- Valores
  quantidade integer DEFAULT 1,
  valor numeric,
  valor_tipo text DEFAULT 'fixo' CHECK (valor_tipo IN ('fixo', 'percentual')),
  
  -- Datas
  data_vencimento date,
  intervalo_dias integer DEFAULT 30,
  evento_vencimento text CHECK (evento_vencimento IN ('assinatura', 'habite_se', 'entrega_chaves', 'custom')),
  
  -- Correção monetária
  com_correcao boolean DEFAULT false,
  indice_correcao text DEFAULT 'INCC',
  parcelas_sem_correcao integer DEFAULT 0,
  
  -- Forma de quitação
  forma_quitacao text DEFAULT 'dinheiro' CHECK (forma_quitacao IN ('dinheiro', 'veiculo', 'imovel', 'outro_bem')),
  forma_pagamento text DEFAULT 'boleto' CHECK (forma_pagamento IN ('boleto', 'ted', 'pix', 'cheque', 'nota_fiscal')),
  
  -- Dados do bem (quando forma_quitacao != 'dinheiro')
  bem_descricao text,
  bem_marca text,
  bem_modelo text,
  bem_ano text,
  bem_placa text,
  bem_cor text,
  bem_renavam text,
  bem_matricula text,
  bem_cartorio text,
  bem_endereco text,
  bem_area_m2 numeric,
  bem_valor_avaliado numeric,
  bem_observacoes text,
  
  -- Corretagem
  beneficiario_tipo text CHECK (beneficiario_tipo IN ('imobiliaria', 'corretor')),
  beneficiario_id uuid,
  
  -- Texto adicional
  observacao_texto text,
  
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.contrato_condicoes_pagamento ENABLE ROW LEVEL SECURITY;

-- RLS policies for contrato_condicoes_pagamento
CREATE POLICY "Admins can manage contrato_condicoes_pagamento"
ON public.contrato_condicoes_pagamento FOR ALL
USING (is_admin(auth.uid()));

CREATE POLICY "Gestores can manage contrato_condicoes_pagamento"
ON public.contrato_condicoes_pagamento FOR ALL
USING (has_role(auth.uid(), 'gestor_produto'::app_role));

CREATE POLICY "Users can view contrato_condicoes_pagamento"
ON public.contrato_condicoes_pagamento FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.contratos c
  WHERE c.id = contrato_condicoes_pagamento.contrato_id
  AND (is_admin(auth.uid()) OR has_role(auth.uid(), 'gestor_produto'::app_role) OR
    c.corretor_id IN (
      SELECT cor.id FROM corretores cor
      JOIN profiles p ON p.email = cor.email
      WHERE p.id = auth.uid()
    ))
));

CREATE POLICY "Users can insert contrato_condicoes_pagamento"
ON public.contrato_condicoes_pagamento FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can update contrato_condicoes_pagamento"
ON public.contrato_condicoes_pagamento FOR UPDATE
USING (true);

-- Triggers for updated_at
CREATE TRIGGER update_template_condicoes_pagamento_updated_at
BEFORE UPDATE ON public.template_condicoes_pagamento
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_contrato_condicoes_pagamento_updated_at
BEFORE UPDATE ON public.contrato_condicoes_pagamento
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();