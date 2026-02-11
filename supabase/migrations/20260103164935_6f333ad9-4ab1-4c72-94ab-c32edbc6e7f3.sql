-- =============================================
-- PARTE 1: Sistema de Modalidades de Pagamento
-- =============================================

-- Tabela de modalidades de pagamento
CREATE TABLE public.modalidades_pagamento (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empreendimento_id uuid REFERENCES empreendimentos(id) ON DELETE CASCADE,
  nome text NOT NULL,
  descricao text,
  percentual_entrada numeric,
  parcelas_entrada integer DEFAULT 1,
  parcelas_mensais integer,
  taxa_juros numeric,
  indice_correcao text DEFAULT 'INCC',
  incluir_baloes boolean DEFAULT false,
  percentual_balao numeric,
  is_padrao boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Índice para busca por empreendimento
CREATE INDEX idx_modalidades_empreendimento ON public.modalidades_pagamento(empreendimento_id);

-- Tabela de componentes de cada modalidade
CREATE TABLE public.modalidade_componentes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  modalidade_id uuid NOT NULL REFERENCES modalidades_pagamento(id) ON DELETE CASCADE,
  tipo_parcela_codigo text NOT NULL,
  ordem integer DEFAULT 0,
  valor_percentual numeric,
  valor_fixo numeric,
  quantidade integer DEFAULT 1,
  intervalo_dias integer DEFAULT 30,
  com_correcao boolean DEFAULT false,
  indice_correcao text DEFAULT 'INCC',
  parcelas_sem_correcao integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Índice para busca por modalidade
CREATE INDEX idx_componentes_modalidade ON public.modalidade_componentes(modalidade_id);

-- =============================================
-- PARTE 2: Histórico de Alterações de Preços
-- =============================================

-- Tabela para registrar alterações de preços de unidades
CREATE TABLE public.unidade_historico_precos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unidade_id uuid NOT NULL REFERENCES unidades(id) ON DELETE CASCADE,
  valor_anterior numeric,
  valor_novo numeric,
  area_anterior numeric,
  area_nova numeric,
  motivo text,
  alterado_por uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- Índices para consultas rápidas
CREATE INDEX idx_historico_precos_unidade ON public.unidade_historico_precos(unidade_id);
CREATE INDEX idx_historico_precos_data ON public.unidade_historico_precos(created_at DESC);

-- =============================================
-- RLS Policies
-- =============================================

-- Modalidades de Pagamento
ALTER TABLE public.modalidades_pagamento ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage modalidades_pagamento"
  ON public.modalidades_pagamento FOR ALL
  USING (is_admin(auth.uid()));

CREATE POLICY "Gestores can manage modalidades_pagamento"
  ON public.modalidades_pagamento FOR ALL
  USING (has_role(auth.uid(), 'gestor_produto'::app_role));

CREATE POLICY "Users can view active modalidades"
  ON public.modalidades_pagamento FOR SELECT
  USING (is_active = true);

-- Modalidade Componentes
ALTER TABLE public.modalidade_componentes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage modalidade_componentes"
  ON public.modalidade_componentes FOR ALL
  USING (is_admin(auth.uid()));

CREATE POLICY "Gestores can manage modalidade_componentes"
  ON public.modalidade_componentes FOR ALL
  USING (has_role(auth.uid(), 'gestor_produto'::app_role));

CREATE POLICY "Users can view active modalidade_componentes"
  ON public.modalidade_componentes FOR SELECT
  USING (is_active = true);

-- Histórico de Preços
ALTER TABLE public.unidade_historico_precos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage unidade_historico_precos"
  ON public.unidade_historico_precos FOR ALL
  USING (is_admin(auth.uid()));

CREATE POLICY "Gestores can manage unidade_historico_precos"
  ON public.unidade_historico_precos FOR ALL
  USING (has_role(auth.uid(), 'gestor_produto'::app_role));

CREATE POLICY "Users can view unidade_historico_precos"
  ON public.unidade_historico_precos FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM unidades u
    WHERE u.id = unidade_historico_precos.unidade_id
    AND user_has_empreendimento_access(auth.uid(), u.empreendimento_id)
  ));

CREATE POLICY "Users can insert unidade_historico_precos"
  ON public.unidade_historico_precos FOR INSERT
  WITH CHECK (true);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_modalidades_pagamento_updated_at
  BEFORE UPDATE ON public.modalidades_pagamento
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();