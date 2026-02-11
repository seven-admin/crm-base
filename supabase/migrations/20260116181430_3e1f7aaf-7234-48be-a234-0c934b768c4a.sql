-- Tabela principal de propostas
CREATE TABLE propostas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero TEXT NOT NULL DEFAULT '',
  
  -- Vínculos
  cliente_id UUID NOT NULL REFERENCES clientes(id),
  empreendimento_id UUID NOT NULL REFERENCES empreendimentos(id),
  corretor_id UUID REFERENCES corretores(id),
  imobiliaria_id UUID REFERENCES imobiliarias(id),
  gestor_id UUID REFERENCES profiles(id),
  
  -- Valores
  valor_tabela NUMERIC,
  valor_proposta NUMERIC,
  desconto_percentual NUMERIC,
  desconto_valor NUMERIC,
  
  -- Datas
  data_emissao DATE DEFAULT CURRENT_DATE,
  data_validade DATE NOT NULL,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'rascunho',
  motivo_recusa TEXT,
  data_aceite DATE,
  
  -- Simulação
  simulacao_dados JSONB,
  observacoes TEXT,
  
  -- Auditoria
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Trigger para gerar número sequencial
CREATE OR REPLACE FUNCTION generate_proposta_numero()
RETURNS TRIGGER AS $$
DECLARE
  year_prefix TEXT;
  next_num INTEGER;
BEGIN
  year_prefix := TO_CHAR(CURRENT_DATE, 'YYYY');
  SELECT COALESCE(MAX(CAST(SUBSTRING(numero FROM 6) AS INTEGER)), 0) + 1
  INTO next_num
  FROM propostas
  WHERE numero LIKE year_prefix || '-%';
  NEW.numero := year_prefix || '-' || LPAD(next_num::TEXT, 5, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_proposta_numero
  BEFORE INSERT ON propostas
  FOR EACH ROW
  EXECUTE FUNCTION generate_proposta_numero();

-- Trigger para updated_at
CREATE TRIGGER update_propostas_updated_at
  BEFORE UPDATE ON propostas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Tabela de unidades da proposta
CREATE TABLE proposta_unidades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposta_id UUID NOT NULL REFERENCES propostas(id) ON DELETE CASCADE,
  unidade_id UUID NOT NULL REFERENCES unidades(id),
  valor_tabela NUMERIC,
  valor_proposta NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de condições de pagamento da proposta
CREATE TABLE proposta_condicoes_pagamento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposta_id UUID NOT NULL REFERENCES propostas(id) ON DELETE CASCADE,
  tipo_parcela_codigo TEXT NOT NULL,
  quantidade INTEGER NOT NULL DEFAULT 1,
  valor NUMERIC NOT NULL DEFAULT 0,
  valor_tipo TEXT,
  data_vencimento DATE,
  intervalo_dias INTEGER,
  com_correcao BOOLEAN DEFAULT false,
  indice_correcao TEXT,
  forma_pagamento TEXT,
  descricao TEXT,
  ordem INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_propostas_cliente ON propostas(cliente_id);
CREATE INDEX idx_propostas_empreendimento ON propostas(empreendimento_id);
CREATE INDEX idx_propostas_status ON propostas(status);
CREATE INDEX idx_propostas_is_active ON propostas(is_active);
CREATE INDEX idx_proposta_unidades_proposta ON proposta_unidades(proposta_id);
CREATE INDEX idx_proposta_condicoes_proposta ON proposta_condicoes_pagamento(proposta_id);

-- RLS Policies
ALTER TABLE propostas ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposta_unidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposta_condicoes_pagamento ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios autenticados podem ver propostas ativas"
  ON propostas FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Usuarios autenticados podem inserir propostas"
  ON propostas FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Usuarios autenticados podem atualizar propostas"
  ON propostas FOR UPDATE
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Usuarios autenticados podem ver unidades da proposta"
  ON proposta_unidades FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuarios autenticados podem inserir unidades da proposta"
  ON proposta_unidades FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Usuarios autenticados podem ver condicoes da proposta"
  ON proposta_condicoes_pagamento FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuarios autenticados podem inserir condicoes da proposta"
  ON proposta_condicoes_pagamento FOR INSERT
  TO authenticated
  WITH CHECK (true);