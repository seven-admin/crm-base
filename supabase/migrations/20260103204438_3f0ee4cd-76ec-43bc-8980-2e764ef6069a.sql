-- Tabela para condições de pagamento da proposta/negociação
CREATE TABLE public.negociacao_condicoes_pagamento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  negociacao_id UUID NOT NULL REFERENCES negociacoes(id) ON DELETE CASCADE,
  tipo_parcela_codigo TEXT NOT NULL,
  ordem INTEGER DEFAULT 0,
  quantidade INTEGER DEFAULT 1,
  valor NUMERIC,
  valor_tipo TEXT DEFAULT 'fixo',
  data_vencimento DATE,
  intervalo_dias INTEGER DEFAULT 30,
  evento_vencimento TEXT,
  com_correcao BOOLEAN DEFAULT false,
  indice_correcao TEXT DEFAULT 'INCC',
  parcelas_sem_correcao INTEGER DEFAULT 0,
  forma_pagamento TEXT DEFAULT 'boleto',
  forma_quitacao TEXT DEFAULT 'dinheiro',
  descricao TEXT,
  observacao_texto TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.negociacao_condicoes_pagamento ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Admins can manage negociacao_condicoes_pagamento"
ON public.negociacao_condicoes_pagamento FOR ALL
USING (is_admin(auth.uid()));

CREATE POLICY "Gestores can manage negociacao_condicoes_pagamento"
ON public.negociacao_condicoes_pagamento FOR ALL
USING (has_role(auth.uid(), 'gestor_produto'));

CREATE POLICY "Users can insert negociacao_condicoes_pagamento"
ON public.negociacao_condicoes_pagamento FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can update negociacao_condicoes_pagamento"
ON public.negociacao_condicoes_pagamento FOR UPDATE
USING (true);

CREATE POLICY "Users can view negociacao_condicoes_pagamento"
ON public.negociacao_condicoes_pagamento FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM negociacoes n
    WHERE n.id = negociacao_condicoes_pagamento.negociacao_id
    AND (
      is_admin(auth.uid()) OR
      has_role(auth.uid(), 'gestor_produto') OR
      n.corretor_id IN (
        SELECT cor.id FROM corretores cor
        JOIN profiles p ON p.email = cor.email
        WHERE p.id = auth.uid()
      )
    )
  )
);

-- Index for faster lookups
CREATE INDEX idx_negociacao_condicoes_pagamento_negociacao_id 
ON public.negociacao_condicoes_pagamento(negociacao_id);

-- Trigger for updated_at
CREATE TRIGGER update_negociacao_condicoes_pagamento_updated_at
BEFORE UPDATE ON public.negociacao_condicoes_pagamento
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();