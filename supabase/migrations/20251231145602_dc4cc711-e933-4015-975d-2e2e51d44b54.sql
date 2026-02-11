-- Tabela principal de estudos de mercado
CREATE TABLE public.estudos_mercado (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  cidade TEXT NOT NULL,
  uf TEXT NOT NULL,
  regiao TEXT,
  descricao TEXT,
  populacao INTEGER,
  renda_media DECIMAL,
  crescimento_anual DECIMAL,
  score_viabilidade DECIMAL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'em_analise',
  recomendacao TEXT DEFAULT 'analisar',
  justificativa TEXT,
  responsavel_id UUID REFERENCES public.profiles(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de concorrentes por estudo
CREATE TABLE public.estudo_concorrentes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estudo_id UUID REFERENCES public.estudos_mercado(id) ON DELETE CASCADE NOT NULL,
  nome TEXT NOT NULL,
  tipo TEXT,
  num_empreendimentos INTEGER DEFAULT 0,
  num_unidades_lancadas INTEGER DEFAULT 0,
  ticket_medio DECIMAL,
  pontos_fortes TEXT,
  pontos_fracos TEXT,
  nivel_ameaca INTEGER DEFAULT 3,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de métricas configuráveis por estudo
CREATE TABLE public.estudo_metricas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estudo_id UUID REFERENCES public.estudos_mercado(id) ON DELETE CASCADE NOT NULL,
  tipo TEXT NOT NULL,
  nome TEXT NOT NULL,
  valor DECIMAL NOT NULL,
  peso DECIMAL DEFAULT 1,
  score_parcial DECIMAL,
  observacao TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_estudos_mercado_cidade ON public.estudos_mercado(cidade);
CREATE INDEX idx_estudos_mercado_uf ON public.estudos_mercado(uf);
CREATE INDEX idx_estudos_mercado_status ON public.estudos_mercado(status);
CREATE INDEX idx_estudo_concorrentes_estudo ON public.estudo_concorrentes(estudo_id);
CREATE INDEX idx_estudo_metricas_estudo ON public.estudo_metricas(estudo_id);

-- Trigger para updated_at
CREATE TRIGGER update_estudos_mercado_updated_at
  BEFORE UPDATE ON public.estudos_mercado
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar RLS
ALTER TABLE public.estudos_mercado ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estudo_concorrentes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estudo_metricas ENABLE ROW LEVEL SECURITY;

-- Políticas para estudos_mercado
CREATE POLICY "Admins can manage estudos_mercado"
  ON public.estudos_mercado FOR ALL
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Gestores can manage estudos_mercado"
  ON public.estudos_mercado FOR ALL
  USING (public.has_role(auth.uid(), 'gestor_produto'));

CREATE POLICY "Users can view active estudos_mercado"
  ON public.estudos_mercado FOR SELECT
  USING (is_active = true);

-- Políticas para estudo_concorrentes
CREATE POLICY "Admins can manage estudo_concorrentes"
  ON public.estudo_concorrentes FOR ALL
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Gestores can manage estudo_concorrentes"
  ON public.estudo_concorrentes FOR ALL
  USING (public.has_role(auth.uid(), 'gestor_produto'));

CREATE POLICY "Users can view estudo_concorrentes"
  ON public.estudo_concorrentes FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.estudos_mercado em
    WHERE em.id = estudo_id AND em.is_active = true
  ));

CREATE POLICY "Users can insert estudo_concorrentes"
  ON public.estudo_concorrentes FOR INSERT
  WITH CHECK (true);

-- Políticas para estudo_metricas
CREATE POLICY "Admins can manage estudo_metricas"
  ON public.estudo_metricas FOR ALL
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Gestores can manage estudo_metricas"
  ON public.estudo_metricas FOR ALL
  USING (public.has_role(auth.uid(), 'gestor_produto'));

CREATE POLICY "Users can view estudo_metricas"
  ON public.estudo_metricas FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.estudos_mercado em
    WHERE em.id = estudo_id AND em.is_active = true
  ));

CREATE POLICY "Users can insert estudo_metricas"
  ON public.estudo_metricas FOR INSERT
  WITH CHECK (true);