-- ETAPA 7: GESTÃO DE CONTRATOS

-- Criar enum para status do contrato
CREATE TYPE contrato_status AS ENUM (
  'em_geracao',
  'enviado_assinatura',
  'assinado',
  'enviado_incorporador',
  'aprovado',
  'reprovado',
  'cancelado'
);

-- Criar sequência para numeração automática de contratos
CREATE SEQUENCE IF NOT EXISTS contrato_numero_seq START 1;

-- Tabela de templates de contrato
CREATE TABLE public.contrato_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT,
  conteudo_html TEXT NOT NULL,
  variaveis JSONB DEFAULT '["nome_cliente", "cpf", "rg", "endereco_cliente", "empreendimento", "unidade", "bloco", "matricula", "memorial", "valor", "data_atual"]'::jsonb,
  empreendimento_id UUID REFERENCES public.empreendimentos(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de contratos
CREATE TABLE public.contratos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero TEXT NOT NULL UNIQUE,
  proposta_id UUID REFERENCES public.propostas(id) ON DELETE SET NULL,
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE RESTRICT,
  empreendimento_id UUID NOT NULL REFERENCES public.empreendimentos(id) ON DELETE RESTRICT,
  corretor_id UUID REFERENCES public.corretores(id) ON DELETE SET NULL,
  imobiliaria_id UUID REFERENCES public.imobiliarias(id) ON DELETE SET NULL,
  template_id UUID REFERENCES public.contrato_templates(id) ON DELETE SET NULL,
  status contrato_status NOT NULL DEFAULT 'em_geracao',
  conteudo_html TEXT,
  versao INTEGER NOT NULL DEFAULT 1,
  valor_contrato NUMERIC,
  data_geracao DATE NOT NULL DEFAULT CURRENT_DATE,
  data_envio_assinatura DATE,
  data_assinatura DATE,
  data_envio_incorporador DATE,
  data_aprovacao DATE,
  motivo_reprovacao TEXT,
  observacoes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de unidades do contrato
CREATE TABLE public.contrato_unidades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contrato_id UUID NOT NULL REFERENCES public.contratos(id) ON DELETE CASCADE,
  unidade_id UUID NOT NULL REFERENCES public.unidades(id) ON DELETE RESTRICT,
  valor_unidade NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(contrato_id, unidade_id)
);

-- Tabela de versões do contrato (histórico)
CREATE TABLE public.contrato_versoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contrato_id UUID NOT NULL REFERENCES public.contratos(id) ON DELETE CASCADE,
  versao INTEGER NOT NULL,
  conteudo_html TEXT NOT NULL,
  alterado_por UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  motivo_alteracao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de documentos do contrato (checklist)
CREATE TYPE documento_contrato_status AS ENUM ('pendente', 'enviado', 'aprovado', 'reprovado');

CREATE TABLE public.contrato_documentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contrato_id UUID NOT NULL REFERENCES public.contratos(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  nome TEXT NOT NULL,
  arquivo_url TEXT,
  status documento_contrato_status NOT NULL DEFAULT 'pendente',
  obrigatorio BOOLEAN NOT NULL DEFAULT false,
  observacao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de pendências do contrato
CREATE TYPE pendencia_status AS ENUM ('aberta', 'resolvida', 'cancelada');

CREATE TABLE public.contrato_pendencias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contrato_id UUID NOT NULL REFERENCES public.contratos(id) ON DELETE CASCADE,
  descricao TEXT NOT NULL,
  responsavel_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  prazo DATE,
  status pendencia_status NOT NULL DEFAULT 'aberta',
  resolucao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Função para gerar número do contrato
CREATE OR REPLACE FUNCTION public.generate_contrato_numero()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.numero := 'CONT-' || LPAD(nextval('contrato_numero_seq')::TEXT, 5, '0');
  RETURN NEW;
END;
$$;

-- Trigger para número automático
CREATE TRIGGER trigger_generate_contrato_numero
  BEFORE INSERT ON public.contratos
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_contrato_numero();

-- Trigger para atualizar updated_at
CREATE TRIGGER update_contratos_updated_at
  BEFORE UPDATE ON public.contratos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_contrato_templates_updated_at
  BEFORE UPDATE ON public.contrato_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_contrato_documentos_updated_at
  BEFORE UPDATE ON public.contrato_documentos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_contrato_pendencias_updated_at
  BEFORE UPDATE ON public.contrato_pendencias
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar RLS
ALTER TABLE public.contrato_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contratos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contrato_unidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contrato_versoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contrato_documentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contrato_pendencias ENABLE ROW LEVEL SECURITY;

-- RLS para contrato_templates
CREATE POLICY "Admins can manage contrato_templates" ON public.contrato_templates
  FOR ALL USING (public.is_admin(auth.uid()));

CREATE POLICY "Gestores can manage contrato_templates" ON public.contrato_templates
  FOR ALL USING (public.has_role(auth.uid(), 'gestor_produto'));

CREATE POLICY "Users can view active templates" ON public.contrato_templates
  FOR SELECT USING (is_active = true);

-- RLS para contratos
CREATE POLICY "Admins can manage contratos" ON public.contratos
  FOR ALL USING (public.is_admin(auth.uid()));

CREATE POLICY "Gestores can manage contratos" ON public.contratos
  FOR ALL USING (public.has_role(auth.uid(), 'gestor_produto'));

CREATE POLICY "Corretores can view own contratos" ON public.contratos
  FOR SELECT USING (
    corretor_id IN (
      SELECT c.id FROM corretores c
      JOIN profiles p ON p.email = c.email
      WHERE p.id = auth.uid()
    )
  );

CREATE POLICY "Corretores can create contratos" ON public.contratos
  FOR INSERT WITH CHECK (true);

-- RLS para contrato_unidades
CREATE POLICY "Admins can manage contrato_unidades" ON public.contrato_unidades
  FOR ALL USING (public.is_admin(auth.uid()));

CREATE POLICY "Gestores can manage contrato_unidades" ON public.contrato_unidades
  FOR ALL USING (public.has_role(auth.uid(), 'gestor_produto'));

CREATE POLICY "Users can view contrato_unidades" ON public.contrato_unidades
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM contratos c
      WHERE c.id = contrato_unidades.contrato_id
      AND (
        public.is_admin(auth.uid())
        OR public.has_role(auth.uid(), 'gestor_produto')
        OR c.corretor_id IN (
          SELECT cor.id FROM corretores cor
          JOIN profiles p ON p.email = cor.email
          WHERE p.id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can insert contrato_unidades" ON public.contrato_unidades
  FOR INSERT WITH CHECK (true);

-- RLS para contrato_versoes
CREATE POLICY "Admins can manage contrato_versoes" ON public.contrato_versoes
  FOR ALL USING (public.is_admin(auth.uid()));

CREATE POLICY "Gestores can manage contrato_versoes" ON public.contrato_versoes
  FOR ALL USING (public.has_role(auth.uid(), 'gestor_produto'));

CREATE POLICY "Users can view contrato_versoes" ON public.contrato_versoes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM contratos c
      WHERE c.id = contrato_versoes.contrato_id
      AND (
        public.is_admin(auth.uid())
        OR public.has_role(auth.uid(), 'gestor_produto')
        OR c.corretor_id IN (
          SELECT cor.id FROM corretores cor
          JOIN profiles p ON p.email = cor.email
          WHERE p.id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can insert contrato_versoes" ON public.contrato_versoes
  FOR INSERT WITH CHECK (true);

-- RLS para contrato_documentos
CREATE POLICY "Admins can manage contrato_documentos" ON public.contrato_documentos
  FOR ALL USING (public.is_admin(auth.uid()));

CREATE POLICY "Gestores can manage contrato_documentos" ON public.contrato_documentos
  FOR ALL USING (public.has_role(auth.uid(), 'gestor_produto'));

CREATE POLICY "Users can view contrato_documentos" ON public.contrato_documentos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM contratos c
      WHERE c.id = contrato_documentos.contrato_id
      AND (
        public.is_admin(auth.uid())
        OR public.has_role(auth.uid(), 'gestor_produto')
        OR c.corretor_id IN (
          SELECT cor.id FROM corretores cor
          JOIN profiles p ON p.email = cor.email
          WHERE p.id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can insert contrato_documentos" ON public.contrato_documentos
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update contrato_documentos" ON public.contrato_documentos
  FOR UPDATE USING (true);

-- RLS para contrato_pendencias
CREATE POLICY "Admins can manage contrato_pendencias" ON public.contrato_pendencias
  FOR ALL USING (public.is_admin(auth.uid()));

CREATE POLICY "Gestores can manage contrato_pendencias" ON public.contrato_pendencias
  FOR ALL USING (public.has_role(auth.uid(), 'gestor_produto'));

CREATE POLICY "Users can view contrato_pendencias" ON public.contrato_pendencias
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM contratos c
      WHERE c.id = contrato_pendencias.contrato_id
      AND (
        public.is_admin(auth.uid())
        OR public.has_role(auth.uid(), 'gestor_produto')
        OR c.corretor_id IN (
          SELECT cor.id FROM corretores cor
          JOIN profiles p ON p.email = cor.email
          WHERE p.id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can insert contrato_pendencias" ON public.contrato_pendencias
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update contrato_pendencias" ON public.contrato_pendencias
  FOR UPDATE USING (true);

-- Índices para performance
CREATE INDEX idx_contratos_proposta ON public.contratos(proposta_id);
CREATE INDEX idx_contratos_cliente ON public.contratos(cliente_id);
CREATE INDEX idx_contratos_empreendimento ON public.contratos(empreendimento_id);
CREATE INDEX idx_contratos_corretor ON public.contratos(corretor_id);
CREATE INDEX idx_contratos_status ON public.contratos(status);
CREATE INDEX idx_contrato_versoes_contrato ON public.contrato_versoes(contrato_id);
CREATE INDEX idx_contrato_documentos_contrato ON public.contrato_documentos(contrato_id);
CREATE INDEX idx_contrato_pendencias_contrato ON public.contrato_pendencias(contrato_id);
CREATE INDEX idx_contrato_unidades_contrato ON public.contrato_unidades(contrato_id);

-- Criar bucket para documentos de contratos
INSERT INTO storage.buckets (id, name, public) VALUES ('contratos-documentos', 'contratos-documentos', false);

-- Políticas de storage para documentos de contratos
CREATE POLICY "Authenticated users can upload contract documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'contratos-documentos' AND auth.role() = 'authenticated');

CREATE POLICY "Users can view contract documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'contratos-documentos' AND auth.role() = 'authenticated');

CREATE POLICY "Admins can delete contract documents"
ON storage.objects FOR DELETE
USING (bucket_id = 'contratos-documentos' AND public.is_admin(auth.uid()));