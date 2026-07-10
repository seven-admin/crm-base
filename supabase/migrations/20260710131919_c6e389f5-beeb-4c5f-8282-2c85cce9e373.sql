
-- Variáveis
CREATE TABLE public.nexa_contrato_variaveis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chave text NOT NULL UNIQUE,
  label text NOT NULL,
  descricao text,
  tipo text NOT NULL DEFAULT 'texto' CHECK (tipo IN ('texto','numero','data','moeda')),
  fonte_sugerida text,
  is_sistema boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.nexa_contrato_variaveis TO authenticated;
GRANT ALL ON public.nexa_contrato_variaveis TO service_role;
ALTER TABLE public.nexa_contrato_variaveis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "nexa variaveis view" ON public.nexa_contrato_variaveis FOR SELECT TO authenticated
  USING (public.is_nexa_user(auth.uid()) OR public.is_admin(auth.uid()));
CREATE POLICY "nexa variaveis manage" ON public.nexa_contrato_variaveis FOR ALL TO authenticated
  USING (public.is_nexa_user(auth.uid()) OR public.is_admin(auth.uid()))
  WITH CHECK (public.is_nexa_user(auth.uid()) OR public.is_admin(auth.uid()));

CREATE TRIGGER trg_nexa_variaveis_updated BEFORE UPDATE ON public.nexa_contrato_variaveis
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Templates
CREATE TABLE public.nexa_contrato_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  descricao text,
  conteudo_html text NOT NULL DEFAULT '',
  variaveis jsonb NOT NULL DEFAULT '[]'::jsonb,
  empreendimento_id uuid REFERENCES public.seven_empreendimentos(id) ON DELETE SET NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.nexa_contrato_templates TO authenticated;
GRANT ALL ON public.nexa_contrato_templates TO service_role;
ALTER TABLE public.nexa_contrato_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "nexa templates view" ON public.nexa_contrato_templates FOR SELECT TO authenticated
  USING (public.is_nexa_user(auth.uid()) OR public.is_admin(auth.uid()));
CREATE POLICY "nexa templates manage" ON public.nexa_contrato_templates FOR ALL TO authenticated
  USING (public.is_nexa_user(auth.uid()) OR public.is_admin(auth.uid()))
  WITH CHECK (public.is_nexa_user(auth.uid()) OR public.is_admin(auth.uid()));

CREATE TRIGGER trg_nexa_templates_updated BEFORE UPDATE ON public.nexa_contrato_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Extensão de nexa_contratos
ALTER TABLE public.nexa_contratos
  ADD COLUMN IF NOT EXISTS numero text,
  ADD COLUMN IF NOT EXISTS template_id uuid REFERENCES public.nexa_contrato_templates(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS cliente_id uuid REFERENCES public.seven_clientes(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS empreendimento_id uuid REFERENCES public.seven_empreendimentos(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS conteudo_html text,
  ADD COLUMN IF NOT EXISTS variaveis_valores jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS pdf_url text,
  ADD COLUMN IF NOT EXISTS valor_contrato numeric,
  ADD COLUMN IF NOT EXISTS data_geracao timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS data_assinatura timestamptz,
  ADD COLUMN IF NOT EXISTS observacoes text,
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Seed variáveis de sistema
INSERT INTO public.nexa_contrato_variaveis (chave, label, tipo, fonte_sugerida, is_sistema, descricao) VALUES
  ('nome_cliente', 'Nome do Cliente', 'texto', 'cliente.nome', true, 'Nome completo do cliente'),
  ('cpf_cliente', 'CPF do Cliente', 'texto', 'cliente.cpf', true, 'CPF do cliente'),
  ('rg_cliente', 'RG do Cliente', 'texto', 'cliente.rg', true, 'RG do cliente'),
  ('email_cliente', 'E-mail do Cliente', 'texto', 'cliente.email', true, 'E-mail do cliente'),
  ('telefone_cliente', 'Telefone do Cliente', 'texto', 'cliente.telefone', true, 'Telefone do cliente'),
  ('endereco_cliente', 'Endereço do Cliente', 'texto', 'cliente.endereco_completo', true, 'Endereço completo do cliente'),
  ('empreendimento', 'Nome do Empreendimento', 'texto', 'empreendimento.nome', true, 'Nome do empreendimento'),
  ('unidade_numero', 'Número da Unidade', 'texto', 'unidade.numero', true, 'Número da unidade'),
  ('unidade_bloco', 'Bloco da Unidade', 'texto', 'unidade.bloco', true, 'Bloco da unidade'),
  ('unidade_tipologia', 'Tipologia da Unidade', 'texto', 'unidade.tipologia', true, 'Tipologia da unidade'),
  ('valor_contrato', 'Valor do Contrato', 'moeda', 'contrato.valor', true, 'Valor total do contrato'),
  ('data_atual', 'Data Atual', 'data', 'sistema.data_atual', true, 'Data de geração do contrato')
ON CONFLICT (chave) DO NOTHING;
