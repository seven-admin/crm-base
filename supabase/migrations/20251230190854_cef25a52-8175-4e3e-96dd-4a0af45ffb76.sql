-- Tabela de Configuração Comercial por Empreendimento
CREATE TABLE public.configuracao_comercial (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empreendimento_id uuid REFERENCES public.empreendimentos(id) ON DELETE CASCADE NOT NULL,
  valor_m2 numeric NOT NULL DEFAULT 409.28,
  data_referencia date NOT NULL DEFAULT CURRENT_DATE,
  
  -- Condição 1A - À Vista
  desconto_avista numeric DEFAULT 7.0,
  
  -- Condição 1B - 24x Fixas
  entrada_curto_prazo numeric DEFAULT 10.0,
  parcelas_curto_prazo integer DEFAULT 24,
  
  -- Condição 2/3 - Parcelamento Longo
  entrada_minima numeric DEFAULT 6.0,
  max_parcelas_entrada integer DEFAULT 10,
  max_parcelas_mensais integer DEFAULT 180,
  taxa_juros_anual numeric DEFAULT 11.0,
  indice_reajuste text DEFAULT 'IPCA',
  
  -- Condição 3 - Intermediárias
  limite_parcelas_anuais numeric DEFAULT 25.0,
  
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(empreendimento_id)
);

-- Tabela de Simulação de Pagamento vinculada à Proposta
CREATE TABLE public.proposta_simulacao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposta_id uuid REFERENCES public.propostas(id) ON DELETE CASCADE UNIQUE,
  
  -- Tipo de condição selecionada
  tipo_condicao text NOT NULL CHECK (tipo_condicao IN ('avista', 'curto_prazo', 'parcelamento', 'com_anuais')),
  
  -- Valores calculados
  valor_total_tabela numeric NOT NULL,
  valor_total_venda numeric NOT NULL,
  valor_desconto numeric DEFAULT 0,
  
  -- Entrada
  percentual_entrada numeric,
  valor_entrada_total numeric,
  qtd_parcelas_entrada integer DEFAULT 1,
  valor_parcela_entrada numeric,
  
  -- Parcelas Mensais (PRICE)
  saldo_financiar numeric,
  qtd_parcelas_mensais integer,
  valor_parcela_mensal numeric,
  taxa_juros_mensal numeric,
  taxa_juros_anual numeric,
  total_juros numeric,
  
  -- Parcelas Anuais (Condição 3)
  qtd_parcelas_anuais integer DEFAULT 0,
  valor_parcela_anual numeric DEFAULT 0,
  total_anuais numeric DEFAULT 0,
  
  -- Totais
  valor_total_prazo numeric,
  indice_reajuste text DEFAULT 'IPCA',
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Trigger para updated_at
CREATE TRIGGER update_configuracao_comercial_updated_at
BEFORE UPDATE ON public.configuracao_comercial
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_proposta_simulacao_updated_at
BEFORE UPDATE ON public.proposta_simulacao
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- RLS para configuracao_comercial
ALTER TABLE public.configuracao_comercial ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage configuracao_comercial"
ON public.configuracao_comercial FOR ALL
USING (is_admin(auth.uid()));

CREATE POLICY "Gestores can manage configuracao_comercial"
ON public.configuracao_comercial FOR ALL
USING (has_role(auth.uid(), 'gestor_produto'));

CREATE POLICY "Users can view configuracao_comercial of authorized empreendimentos"
ON public.configuracao_comercial FOR SELECT
USING (user_has_empreendimento_access(auth.uid(), empreendimento_id));

-- RLS para proposta_simulacao
ALTER TABLE public.proposta_simulacao ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage proposta_simulacao"
ON public.proposta_simulacao FOR ALL
USING (is_admin(auth.uid()));

CREATE POLICY "Gestores can manage proposta_simulacao"
ON public.proposta_simulacao FOR ALL
USING (has_role(auth.uid(), 'gestor_produto'));

CREATE POLICY "Users can insert proposta_simulacao"
ON public.proposta_simulacao FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can view proposta_simulacao"
ON public.proposta_simulacao FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM propostas p
    WHERE p.id = proposta_simulacao.proposta_id
    AND (
      is_admin(auth.uid()) OR
      has_role(auth.uid(), 'gestor_produto') OR
      p.corretor_id IN (
        SELECT c.id FROM corretores c
        JOIN profiles pr ON pr.email = c.email
        WHERE pr.id = auth.uid()
      )
    )
  )
);

CREATE POLICY "Users can update proposta_simulacao"
ON public.proposta_simulacao FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM propostas p
    WHERE p.id = proposta_simulacao.proposta_id
    AND (
      is_admin(auth.uid()) OR
      has_role(auth.uid(), 'gestor_produto') OR
      p.corretor_id IN (
        SELECT c.id FROM corretores c
        JOIN profiles pr ON pr.email = c.email
        WHERE pr.id = auth.uid()
      )
    )
  )
);