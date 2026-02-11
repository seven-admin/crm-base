-- ETAPA 2: EMPREENDIMENTOS - Estrutura completa

-- 1. Criar enums
CREATE TYPE public.empreendimento_tipo AS ENUM ('loteamento', 'condominio', 'predio', 'comercial');
CREATE TYPE public.empreendimento_status AS ENUM ('lancamento', 'obra', 'entregue');
CREATE TYPE public.unidade_status AS ENUM ('disponivel', 'reservada', 'vendida', 'bloqueada');
CREATE TYPE public.documento_tipo AS ENUM ('registro_incorporacao', 'matricula', 'projeto', 'licenca', 'contrato', 'memorial', 'outro');
CREATE TYPE public.midia_tipo AS ENUM ('imagem', 'video', 'tour_virtual', 'pdf');

-- 2. Tabela principal de empreendimentos
CREATE TABLE public.empreendimentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  tipo empreendimento_tipo NOT NULL,
  status empreendimento_status NOT NULL DEFAULT 'lancamento',
  incorporadora TEXT,
  construtora TEXT,
  responsavel_comercial_id UUID REFERENCES public.profiles(id),
  descricao_curta TEXT,
  descricao_completa TEXT,
  endereco_logradouro TEXT,
  endereco_numero TEXT,
  endereco_complemento TEXT,
  endereco_bairro TEXT,
  endereco_cidade TEXT,
  endereco_uf TEXT,
  endereco_cep TEXT,
  latitude NUMERIC(10, 7),
  longitude NUMERIC(10, 7),
  total_unidades INTEGER DEFAULT 0,
  infraestrutura TEXT[],
  registro_incorporacao TEXT,
  matricula_mae TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Tabela de blocos/torres
CREATE TABLE public.blocos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empreendimento_id UUID NOT NULL REFERENCES public.empreendimentos(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  total_andares INTEGER,
  unidades_por_andar INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. Tabela de tipologias
CREATE TABLE public.tipologias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empreendimento_id UUID NOT NULL REFERENCES public.empreendimentos(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  area_privativa NUMERIC(10, 2),
  area_total NUMERIC(10, 2),
  quartos INTEGER DEFAULT 0,
  suites INTEGER DEFAULT 0,
  banheiros INTEGER DEFAULT 0,
  vagas INTEGER DEFAULT 0,
  valor_base NUMERIC(15, 2),
  planta_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5. Tabela de unidades
CREATE TABLE public.unidades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empreendimento_id UUID NOT NULL REFERENCES public.empreendimentos(id) ON DELETE CASCADE,
  bloco_id UUID REFERENCES public.blocos(id) ON DELETE SET NULL,
  tipologia_id UUID REFERENCES public.tipologias(id) ON DELETE SET NULL,
  numero TEXT NOT NULL,
  andar INTEGER,
  posicao TEXT,
  area_privativa NUMERIC(10, 2),
  valor NUMERIC(15, 2),
  status unidade_status NOT NULL DEFAULT 'disponivel',
  observacoes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(empreendimento_id, bloco_id, numero)
);

-- 6. Tabela de documentos
CREATE TABLE public.empreendimento_documentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empreendimento_id UUID NOT NULL REFERENCES public.empreendimentos(id) ON DELETE CASCADE,
  tipo documento_tipo NOT NULL DEFAULT 'outro',
  nome TEXT NOT NULL,
  descricao TEXT,
  arquivo_url TEXT NOT NULL,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 7. Tabela de mídias
CREATE TABLE public.empreendimento_midias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empreendimento_id UUID NOT NULL REFERENCES public.empreendimentos(id) ON DELETE CASCADE,
  tipo midia_tipo NOT NULL DEFAULT 'imagem',
  nome TEXT,
  url TEXT NOT NULL,
  is_capa BOOLEAN NOT NULL DEFAULT false,
  ordem INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 8. Tabela de corretores autorizados
CREATE TABLE public.empreendimento_corretores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empreendimento_id UUID NOT NULL REFERENCES public.empreendimentos(id) ON DELETE CASCADE,
  corretor_id UUID NOT NULL REFERENCES public.corretores(id) ON DELETE CASCADE,
  autorizado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  autorizado_por UUID REFERENCES public.profiles(id),
  UNIQUE(empreendimento_id, corretor_id)
);

-- 9. Tabela de imobiliárias parceiras
CREATE TABLE public.empreendimento_imobiliarias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empreendimento_id UUID NOT NULL REFERENCES public.empreendimentos(id) ON DELETE CASCADE,
  imobiliaria_id UUID NOT NULL REFERENCES public.imobiliarias(id) ON DELETE CASCADE,
  comissao_percentual NUMERIC(5, 2),
  autorizado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  autorizado_por UUID REFERENCES public.profiles(id),
  UNIQUE(empreendimento_id, imobiliaria_id)
);

-- 10. Índices para performance
CREATE INDEX idx_empreendimentos_status ON public.empreendimentos(status);
CREATE INDEX idx_empreendimentos_tipo ON public.empreendimentos(tipo);
CREATE INDEX idx_empreendimentos_cidade ON public.empreendimentos(endereco_cidade);
CREATE INDEX idx_blocos_empreendimento ON public.blocos(empreendimento_id);
CREATE INDEX idx_tipologias_empreendimento ON public.tipologias(empreendimento_id);
CREATE INDEX idx_unidades_empreendimento ON public.unidades(empreendimento_id);
CREATE INDEX idx_unidades_bloco ON public.unidades(bloco_id);
CREATE INDEX idx_unidades_status ON public.unidades(status);

-- 11. Triggers para updated_at
CREATE TRIGGER update_empreendimentos_updated_at
  BEFORE UPDATE ON public.empreendimentos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_blocos_updated_at
  BEFORE UPDATE ON public.blocos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tipologias_updated_at
  BEFORE UPDATE ON public.tipologias
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_unidades_updated_at
  BEFORE UPDATE ON public.unidades
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 12. Função para verificar acesso ao empreendimento (atualizada)
CREATE OR REPLACE FUNCTION public.user_has_empreendimento_access(_user_id uuid, _empreendimento_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    public.is_admin(_user_id) 
    OR public.has_role(_user_id, 'gestor_produto')
    OR EXISTS (
      SELECT 1 FROM public.user_empreendimentos
      WHERE user_id = _user_id 
        AND empreendimento_id = _empreendimento_id
    )
    OR EXISTS (
      SELECT 1 FROM public.empreendimento_corretores ec
      JOIN public.corretores c ON c.id = ec.corretor_id
      JOIN public.profiles p ON p.email = c.email
      WHERE ec.empreendimento_id = _empreendimento_id
        AND p.id = _user_id
    )
$$;

-- 13. Enable RLS em todas as tabelas
ALTER TABLE public.empreendimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tipologias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.empreendimento_documentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.empreendimento_midias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.empreendimento_corretores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.empreendimento_imobiliarias ENABLE ROW LEVEL SECURITY;

-- 14. RLS Policies para empreendimentos
CREATE POLICY "Admins can manage empreendimentos"
  ON public.empreendimentos FOR ALL
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Gestores can manage empreendimentos"
  ON public.empreendimentos FOR ALL
  USING (public.has_role(auth.uid(), 'gestor_produto'));

CREATE POLICY "Users can view authorized empreendimentos"
  ON public.empreendimentos FOR SELECT
  USING (public.user_has_empreendimento_access(auth.uid(), id));

-- 15. RLS Policies para blocos
CREATE POLICY "Admins can manage blocos"
  ON public.blocos FOR ALL
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Gestores can manage blocos"
  ON public.blocos FOR ALL
  USING (public.has_role(auth.uid(), 'gestor_produto'));

CREATE POLICY "Users can view blocos of authorized empreendimentos"
  ON public.blocos FOR SELECT
  USING (public.user_has_empreendimento_access(auth.uid(), empreendimento_id));

-- 16. RLS Policies para tipologias
CREATE POLICY "Admins can manage tipologias"
  ON public.tipologias FOR ALL
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Gestores can manage tipologias"
  ON public.tipologias FOR ALL
  USING (public.has_role(auth.uid(), 'gestor_produto'));

CREATE POLICY "Users can view tipologias of authorized empreendimentos"
  ON public.tipologias FOR SELECT
  USING (public.user_has_empreendimento_access(auth.uid(), empreendimento_id));

-- 17. RLS Policies para unidades
CREATE POLICY "Admins can manage unidades"
  ON public.unidades FOR ALL
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Gestores can manage unidades"
  ON public.unidades FOR ALL
  USING (public.has_role(auth.uid(), 'gestor_produto'));

CREATE POLICY "Users can view unidades of authorized empreendimentos"
  ON public.unidades FOR SELECT
  USING (public.user_has_empreendimento_access(auth.uid(), empreendimento_id));

-- 18. RLS Policies para documentos
CREATE POLICY "Admins can manage documentos"
  ON public.empreendimento_documentos FOR ALL
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Gestores can manage documentos"
  ON public.empreendimento_documentos FOR ALL
  USING (public.has_role(auth.uid(), 'gestor_produto'));

CREATE POLICY "Users can view documentos of authorized empreendimentos"
  ON public.empreendimento_documentos FOR SELECT
  USING (public.user_has_empreendimento_access(auth.uid(), empreendimento_id));

-- 19. RLS Policies para mídias
CREATE POLICY "Admins can manage midias"
  ON public.empreendimento_midias FOR ALL
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Gestores can manage midias"
  ON public.empreendimento_midias FOR ALL
  USING (public.has_role(auth.uid(), 'gestor_produto'));

CREATE POLICY "Users can view midias of authorized empreendimentos"
  ON public.empreendimento_midias FOR SELECT
  USING (public.user_has_empreendimento_access(auth.uid(), empreendimento_id));

-- 20. RLS Policies para empreendimento_corretores
CREATE POLICY "Admins can manage empreendimento_corretores"
  ON public.empreendimento_corretores FOR ALL
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Gestores can manage empreendimento_corretores"
  ON public.empreendimento_corretores FOR ALL
  USING (public.has_role(auth.uid(), 'gestor_produto'));

CREATE POLICY "Users can view empreendimento_corretores of authorized empreendimentos"
  ON public.empreendimento_corretores FOR SELECT
  USING (public.user_has_empreendimento_access(auth.uid(), empreendimento_id));

-- 21. RLS Policies para empreendimento_imobiliarias
CREATE POLICY "Admins can manage empreendimento_imobiliarias"
  ON public.empreendimento_imobiliarias FOR ALL
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Gestores can manage empreendimento_imobiliarias"
  ON public.empreendimento_imobiliarias FOR ALL
  USING (public.has_role(auth.uid(), 'gestor_produto'));

CREATE POLICY "Users can view empreendimento_imobiliarias of authorized empreendimentos"
  ON public.empreendimento_imobiliarias FOR SELECT
  USING (public.user_has_empreendimento_access(auth.uid(), empreendimento_id));

-- 22. Storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('empreendimentos-midias', 'empreendimentos-midias', true, 52428800, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm']),
  ('empreendimentos-documentos', 'empreendimentos-documentos', false, 52428800, ARRAY['application/pdf', 'image/jpeg', 'image/png']);

-- 23. Storage policies para empreendimentos-midias (público)
CREATE POLICY "Public can view empreendimentos midias"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'empreendimentos-midias');

CREATE POLICY "Admins can upload empreendimentos midias"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'empreendimentos-midias' AND public.is_admin(auth.uid()));

CREATE POLICY "Gestores can upload empreendimentos midias"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'empreendimentos-midias' AND public.has_role(auth.uid(), 'gestor_produto'));

CREATE POLICY "Admins can delete empreendimentos midias"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'empreendimentos-midias' AND public.is_admin(auth.uid()));

CREATE POLICY "Gestores can delete empreendimentos midias"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'empreendimentos-midias' AND public.has_role(auth.uid(), 'gestor_produto'));

-- 24. Storage policies para empreendimentos-documentos (privado)
CREATE POLICY "Authorized users can view empreendimentos documentos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'empreendimentos-documentos');

CREATE POLICY "Admins can upload empreendimentos documentos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'empreendimentos-documentos' AND public.is_admin(auth.uid()));

CREATE POLICY "Gestores can upload empreendimentos documentos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'empreendimentos-documentos' AND public.has_role(auth.uid(), 'gestor_produto'));

CREATE POLICY "Admins can delete empreendimentos documentos"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'empreendimentos-documentos' AND public.is_admin(auth.uid()));

CREATE POLICY "Gestores can delete empreendimentos documentos"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'empreendimentos-documentos' AND public.has_role(auth.uid(), 'gestor_produto'));

-- 25. Atualizar a FK de user_empreendimentos para usar a nova tabela
ALTER TABLE public.user_empreendimentos
  DROP CONSTRAINT IF EXISTS user_empreendimentos_empreendimento_id_fkey;

ALTER TABLE public.user_empreendimentos
  ADD CONSTRAINT user_empreendimentos_empreendimento_id_fkey 
  FOREIGN KEY (empreendimento_id) REFERENCES public.empreendimentos(id) ON DELETE CASCADE;

-- 26. Adicionar módulo empreendimentos se não existir
INSERT INTO public.modules (name, display_name, description, icon, route, is_active)
VALUES ('empreendimentos', 'Empreendimentos', 'Gestão de empreendimentos imobiliários', 'Building2', '/empreendimentos', true)
ON CONFLICT (name) DO NOTHING;