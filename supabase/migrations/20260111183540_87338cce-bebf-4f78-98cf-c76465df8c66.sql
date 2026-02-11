-- Tabela para registrar aceites de termos pelos usuários
CREATE TABLE public.termos_aceites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('termos_uso', 'politica_privacidade')),
  versao_hash TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para consultas rápidas
CREATE INDEX idx_termos_aceites_user ON public.termos_aceites(user_id, tipo);
CREATE INDEX idx_termos_aceites_versao ON public.termos_aceites(versao_hash);
CREATE INDEX idx_termos_aceites_created ON public.termos_aceites(created_at DESC);

-- RLS
ALTER TABLE public.termos_aceites ENABLE ROW LEVEL SECURITY;

-- Usuário pode ver apenas seus próprios aceites
CREATE POLICY "Usuários veem próprios aceites"
  ON public.termos_aceites FOR SELECT
  USING (auth.uid() = user_id);

-- Usuário pode inserir apenas para si mesmo
CREATE POLICY "Usuários registram próprio aceite"
  ON public.termos_aceites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins podem ver todos (para auditoria)
CREATE POLICY "Admins veem todos aceites"
  ON public.termos_aceites FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('super_admin', 'admin')
    )
  );

-- Tabela para histórico de versões dos termos
CREATE TABLE public.termos_versoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo TEXT NOT NULL CHECK (tipo IN ('termos_uso', 'politica_privacidade')),
  conteudo TEXT NOT NULL,
  versao_hash TEXT NOT NULL,
  criado_por UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_termos_versoes_tipo ON public.termos_versoes(tipo, created_at DESC);
CREATE INDEX idx_termos_versoes_hash ON public.termos_versoes(versao_hash);

-- RLS
ALTER TABLE public.termos_versoes ENABLE ROW LEVEL SECURITY;

-- Todos autenticados podem ver (para verificar versão)
CREATE POLICY "Usuários veem versões"
  ON public.termos_versoes FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Apenas admins podem inserir
CREATE POLICY "Admins criam versões"
  ON public.termos_versoes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('super_admin', 'admin')
    )
  );

-- Função para gerar hash de versão
CREATE OR REPLACE FUNCTION public.gerar_hash_versao(conteudo TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN md5(COALESCE(conteudo, ''));
END;
$$ LANGUAGE plpgsql IMMUTABLE;