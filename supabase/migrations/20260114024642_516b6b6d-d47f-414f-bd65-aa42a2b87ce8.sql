-- Criar tabela incorporadoras
CREATE TABLE IF NOT EXISTS public.incorporadoras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  cnpj TEXT,
  razao_social TEXT,
  telefone TEXT,
  email TEXT,
  endereco_logradouro TEXT,
  endereco_numero TEXT,
  endereco_bairro TEXT,
  endereco_cidade TEXT,
  endereco_uf TEXT,
  endereco_cep TEXT,
  logo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_incorporadoras_nome ON public.incorporadoras(nome);
CREATE INDEX IF NOT EXISTS idx_incorporadoras_cnpj ON public.incorporadoras(cnpj);
CREATE INDEX IF NOT EXISTS idx_incorporadoras_is_active ON public.incorporadoras(is_active);

-- Trigger de updated_at
DROP TRIGGER IF EXISTS update_incorporadoras_updated_at ON public.incorporadoras;
CREATE TRIGGER update_incorporadoras_updated_at
  BEFORE UPDATE ON public.incorporadoras
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar RLS
ALTER TABLE public.incorporadoras ENABLE ROW LEVEL SECURITY;

-- Policies de acesso
DROP POLICY IF EXISTS "Usuários autenticados podem visualizar incorporadoras" ON public.incorporadoras;
CREATE POLICY "Usuários autenticados podem visualizar incorporadoras"
  ON public.incorporadoras FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admins podem criar incorporadoras" ON public.incorporadoras;
CREATE POLICY "Admins podem criar incorporadoras"
  ON public.incorporadoras FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins podem atualizar incorporadoras" ON public.incorporadoras;
CREATE POLICY "Admins podem atualizar incorporadoras"
  ON public.incorporadoras FOR UPDATE
  TO authenticated
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins podem deletar incorporadoras" ON public.incorporadoras;
CREATE POLICY "Admins podem deletar incorporadoras"
  ON public.incorporadoras FOR DELETE
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- Adicionar FK em empreendimentos
ALTER TABLE public.empreendimentos 
  ADD COLUMN IF NOT EXISTS incorporadora_id UUID REFERENCES public.incorporadoras(id);