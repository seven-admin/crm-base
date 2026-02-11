-- Adicionar campos para fluxo de caixa
ALTER TABLE public.lancamentos_financeiros
ADD COLUMN IF NOT EXISTS categoria_fluxo TEXT,
ADD COLUMN IF NOT EXISTS subcategoria TEXT,
ADD COLUMN IF NOT EXISTS status_conferencia TEXT DEFAULT 'pendente',
ADD COLUMN IF NOT EXISTS conferido_por UUID REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS conferido_em TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS centro_custo_id UUID;

-- Tabela de centros de custo
CREATE TABLE IF NOT EXISTS public.centros_custo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.centros_custo ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para centros_custo
CREATE POLICY "Admins can manage centros_custo" ON public.centros_custo
  FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Gestores can manage centros_custo" ON public.centros_custo
  FOR ALL USING (has_role(auth.uid(), 'gestor_produto'));

CREATE POLICY "Users can view centros_custo" ON public.centros_custo
  FOR SELECT USING (true);

-- Vincular centro de custo a empreendimentos
CREATE TABLE IF NOT EXISTS public.centro_custo_empreendimentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  centro_custo_id UUID NOT NULL REFERENCES centros_custo(id) ON DELETE CASCADE,
  empreendimento_id UUID NOT NULL REFERENCES empreendimentos(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(centro_custo_id, empreendimento_id)
);

-- Habilitar RLS
ALTER TABLE public.centro_custo_empreendimentos ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para centro_custo_empreendimentos
CREATE POLICY "Admins can manage centro_custo_empreendimentos" ON public.centro_custo_empreendimentos
  FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Gestores can manage centro_custo_empreendimentos" ON public.centro_custo_empreendimentos
  FOR ALL USING (has_role(auth.uid(), 'gestor_produto'));

CREATE POLICY "Users can view centro_custo_empreendimentos" ON public.centro_custo_empreendimentos
  FOR SELECT USING (user_has_empreendimento_access(auth.uid(), empreendimento_id));

-- Adicionar FK de centro_custo aos lançamentos
ALTER TABLE public.lancamentos_financeiros
ADD CONSTRAINT lancamentos_financeiros_centro_custo_id_fkey 
FOREIGN KEY (centro_custo_id) REFERENCES centros_custo(id);

-- Saldo inicial mensal
CREATE TABLE IF NOT EXISTS public.saldos_mensais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),
  ano INTEGER NOT NULL,
  saldo_inicial NUMERIC NOT NULL DEFAULT 0,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(mes, ano)
);

-- Habilitar RLS
ALTER TABLE public.saldos_mensais ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para saldos_mensais
CREATE POLICY "Admins can manage saldos_mensais" ON public.saldos_mensais
  FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Gestores can manage saldos_mensais" ON public.saldos_mensais
  FOR ALL USING (has_role(auth.uid(), 'gestor_produto'));

CREATE POLICY "Users can view saldos_mensais" ON public.saldos_mensais
  FOR SELECT USING (true);

-- Tabela de categorias de fluxo de caixa
CREATE TABLE IF NOT EXISTS public.categorias_fluxo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'saida')),
  categoria_pai_id UUID REFERENCES categorias_fluxo(id),
  ordem INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.categorias_fluxo ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para categorias_fluxo
CREATE POLICY "Admins can manage categorias_fluxo" ON public.categorias_fluxo
  FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Gestores can manage categorias_fluxo" ON public.categorias_fluxo
  FOR ALL USING (has_role(auth.uid(), 'gestor_produto'));

CREATE POLICY "Users can view categorias_fluxo" ON public.categorias_fluxo
  FOR SELECT USING (true);