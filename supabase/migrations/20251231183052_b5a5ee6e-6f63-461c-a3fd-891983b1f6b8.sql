-- ================================================
-- MÓDULO 2: Gestão de Leads com Gestores de Produto
-- ================================================

-- Adicionar tipo ao lead (geral ou atribuido)
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS tipo TEXT DEFAULT 'geral';

-- Tabela de relacionamento N:N entre leads e gestores
CREATE TABLE IF NOT EXISTS public.lead_gestores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  gestor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(lead_id, gestor_id)
);

ALTER TABLE public.lead_gestores ENABLE ROW LEVEL SECURITY;

-- RLS para lead_gestores
CREATE POLICY "Admins can manage lead_gestores"
  ON public.lead_gestores FOR ALL
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Gestores can view own lead_gestores"
  ON public.lead_gestores FOR SELECT
  USING (gestor_id = auth.uid());

-- ================================================
-- MÓDULO 3: Restrição de Visibilidade
-- ================================================

-- Adicionar gestor_id aos clientes
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS gestor_id UUID REFERENCES public.profiles(id);

-- ================================================
-- MÓDULO 4: Comissões para Gestores de Produto
-- ================================================

-- Adicionar percentual de comissão ao perfil
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS percentual_comissao NUMERIC DEFAULT 0;

-- Adicionar gestor_id às comissões
ALTER TABLE public.comissoes ADD COLUMN IF NOT EXISTS gestor_id UUID REFERENCES public.profiles(id);
ALTER TABLE public.comissoes ADD COLUMN IF NOT EXISTS nf_quitada BOOLEAN DEFAULT false;

-- ================================================
-- MÓDULO 5: Dados de Empreendimento e Bonificações
-- ================================================

-- Novos campos em empreendimentos
ALTER TABLE public.empreendimentos 
  ADD COLUMN IF NOT EXISTS data_inicio_contrato DATE,
  ADD COLUMN IF NOT EXISTS meta_6_meses INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS meta_12_meses INTEGER DEFAULT 0;

-- Tabela de bonificações
CREATE TABLE IF NOT EXISTS public.bonificacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empreendimento_id UUID NOT NULL REFERENCES public.empreendimentos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('meta_6_meses', 'meta_12_meses', 'venda_mensal')),
  periodo_inicio DATE NOT NULL,
  periodo_fim DATE NOT NULL,
  meta_unidades INTEGER,
  unidades_vendidas INTEGER DEFAULT 0,
  valor_bonificacao NUMERIC DEFAULT 0,
  percentual_atingimento NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'calculado', 'pago')),
  nf_numero TEXT,
  nf_quitada BOOLEAN DEFAULT false,
  data_pagamento DATE,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.bonificacoes ENABLE ROW LEVEL SECURITY;

-- Elegibilidade de usuário para bonificação por empreendimento
CREATE TABLE IF NOT EXISTS public.usuario_empreendimento_bonus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  empreendimento_id UUID NOT NULL REFERENCES public.empreendimentos(id) ON DELETE CASCADE,
  elegivel_bonificacao BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, empreendimento_id)
);

ALTER TABLE public.usuario_empreendimento_bonus ENABLE ROW LEVEL SECURITY;

-- RLS para bonificacoes
CREATE POLICY "Admins can manage bonificacoes"
  ON public.bonificacoes FOR ALL
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Gestores can view own bonificacoes"
  ON public.bonificacoes FOR SELECT
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'gestor_produto'));

-- RLS para usuario_empreendimento_bonus
CREATE POLICY "Admins can manage usuario_empreendimento_bonus"
  ON public.usuario_empreendimento_bonus FOR ALL
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Users can view own eligibility"
  ON public.usuario_empreendimento_bonus FOR SELECT
  USING (user_id = auth.uid());

-- ================================================
-- MÓDULO 6: Fluxo de Caixa Completo (DRE)
-- ================================================

-- Plano de contas
CREATE TABLE IF NOT EXISTS public.plano_contas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT NOT NULL UNIQUE,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('receita', 'despesa')),
  categoria TEXT NOT NULL CHECK (categoria IN ('operacional', 'financeiro', 'investimento')),
  pai_id UUID REFERENCES public.plano_contas(id),
  ordem INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.plano_contas ENABLE ROW LEVEL SECURITY;

-- Inserir contas padrão
INSERT INTO public.plano_contas (codigo, nome, tipo, categoria) VALUES
  ('1', 'Receitas', 'receita', 'operacional'),
  ('1.1', 'Comissões Recebidas', 'receita', 'operacional'),
  ('1.2', 'Bonificações Recebidas', 'receita', 'operacional'),
  ('1.3', 'Vendas', 'receita', 'operacional'),
  ('2', 'Despesas', 'despesa', 'operacional'),
  ('2.1', 'Comissões Pagas', 'despesa', 'operacional'),
  ('2.2', 'Bonificações Pagas', 'despesa', 'operacional'),
  ('2.3', 'Despesas Administrativas', 'despesa', 'operacional'),
  ('2.4', 'Despesas com Pessoal', 'despesa', 'operacional'),
  ('3', 'Financeiro', 'despesa', 'financeiro'),
  ('3.1', 'Juros e Multas', 'despesa', 'financeiro'),
  ('3.2', 'Taxas Bancárias', 'despesa', 'financeiro')
ON CONFLICT (codigo) DO NOTHING;

-- Lançamentos financeiros
CREATE TABLE IF NOT EXISTS public.lancamentos_financeiros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo TEXT NOT NULL CHECK (tipo IN ('pagar', 'receber')),
  conta_id UUID REFERENCES public.plano_contas(id),
  descricao TEXT NOT NULL,
  valor NUMERIC NOT NULL,
  data_vencimento DATE NOT NULL,
  data_pagamento DATE,
  data_competencia DATE,
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'cancelado', 'vencido')),
  comissao_id UUID REFERENCES public.comissoes(id),
  bonificacao_id UUID REFERENCES public.bonificacoes(id),
  contrato_id UUID REFERENCES public.contratos(id),
  empreendimento_id UUID REFERENCES public.empreendimentos(id),
  nf_numero TEXT,
  nf_quitada BOOLEAN DEFAULT false,
  observacoes TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.lancamentos_financeiros ENABLE ROW LEVEL SECURITY;

-- RLS para plano_contas
CREATE POLICY "Anyone can view plano_contas"
  ON public.plano_contas FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage plano_contas"
  ON public.plano_contas FOR ALL
  USING (public.is_admin(auth.uid()));

-- RLS para lancamentos_financeiros
CREATE POLICY "Admins can manage lancamentos"
  ON public.lancamentos_financeiros FOR ALL
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Gestores can view lancamentos"
  ON public.lancamentos_financeiros FOR SELECT
  USING (public.has_role(auth.uid(), 'gestor_produto'));

CREATE POLICY "Users can insert lancamentos"
  ON public.lancamentos_financeiros FOR INSERT
  WITH CHECK (true);

-- ================================================
-- MÓDULO 7: Variáveis de Contrato no Fechamento
-- ================================================

-- Adicionar campos de corretagem variável ao contrato
ALTER TABLE public.contratos 
  ADD COLUMN IF NOT EXISTS percentual_corretagem NUMERIC,
  ADD COLUMN IF NOT EXISTS valor_corretagem NUMERIC;

-- Trigger para atualizar updated_at em bonificacoes
CREATE TRIGGER update_bonificacoes_updated_at
  BEFORE UPDATE ON public.bonificacoes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para atualizar updated_at em lancamentos_financeiros
CREATE TRIGGER update_lancamentos_updated_at
  BEFORE UPDATE ON public.lancamentos_financeiros
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();