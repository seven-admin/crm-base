-- ETAPA 1: CADASTROS BASE (LEADS, PARCEIROS E MERCADO)

-- Criar enum para temperatura de leads
CREATE TYPE public.lead_temperatura AS ENUM ('frio', 'morno', 'quente');

-- Tabela de Imobiliárias
CREATE TABLE public.imobiliarias (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  cnpj TEXT UNIQUE,
  site TEXT,
  endereco_logradouro TEXT,
  endereco_numero TEXT,
  endereco_complemento TEXT,
  endereco_bairro TEXT,
  endereco_cidade TEXT,
  endereco_uf TEXT,
  endereco_cep TEXT,
  gestor_nome TEXT,
  gestor_telefone TEXT,
  gestor_email TEXT,
  telefone TEXT,
  whatsapp TEXT,
  email TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de Corretores
CREATE TABLE public.corretores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome_completo TEXT NOT NULL,
  cpf TEXT UNIQUE,
  imobiliaria_id UUID REFERENCES public.imobiliarias(id) ON DELETE SET NULL,
  telefone TEXT,
  whatsapp TEXT,
  email TEXT,
  creci TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de Leads
CREATE TABLE public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  telefone TEXT,
  whatsapp TEXT,
  email TEXT,
  origem TEXT,
  temperatura public.lead_temperatura NOT NULL DEFAULT 'frio',
  imobiliaria_id UUID REFERENCES public.imobiliarias(id) ON DELETE SET NULL,
  corretor_id UUID REFERENCES public.corretores(id) ON DELETE SET NULL,
  observacoes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de Interações com Leads
CREATE TABLE public.lead_interactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  tipo TEXT NOT NULL,
  descricao TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.imobiliarias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.corretores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_interactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies para Imobiliárias
CREATE POLICY "Admins can manage imobiliarias"
ON public.imobiliarias FOR ALL
USING (public.is_admin(auth.uid()));

CREATE POLICY "Authenticated users can view imobiliarias"
ON public.imobiliarias FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Gestores can manage imobiliarias"
ON public.imobiliarias FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'gestor_produto'));

-- RLS Policies para Corretores
CREATE POLICY "Admins can manage corretores"
ON public.corretores FOR ALL
USING (public.is_admin(auth.uid()));

CREATE POLICY "Authenticated users can view corretores"
ON public.corretores FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Gestores can manage corretores"
ON public.corretores FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'gestor_produto'));

-- RLS Policies para Leads
CREATE POLICY "Admins can manage leads"
ON public.leads FOR ALL
USING (public.is_admin(auth.uid()));

CREATE POLICY "Gestores can manage leads"
ON public.leads FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'gestor_produto'));

CREATE POLICY "Corretores can view own leads"
ON public.leads FOR SELECT
TO authenticated
USING (
  corretor_id IN (
    SELECT c.id FROM public.corretores c 
    WHERE c.email = (SELECT email FROM public.profiles WHERE id = auth.uid())
  )
);

CREATE POLICY "Corretores can update own leads"
ON public.leads FOR UPDATE
TO authenticated
USING (
  corretor_id IN (
    SELECT c.id FROM public.corretores c 
    WHERE c.email = (SELECT email FROM public.profiles WHERE id = auth.uid())
  )
);

-- RLS Policies para Lead Interactions
CREATE POLICY "Admins can manage lead_interactions"
ON public.lead_interactions FOR ALL
USING (public.is_admin(auth.uid()));

CREATE POLICY "Authenticated users can view lead_interactions"
ON public.lead_interactions FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create lead_interactions"
ON public.lead_interactions FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Triggers para updated_at
CREATE TRIGGER update_imobiliarias_updated_at
BEFORE UPDATE ON public.imobiliarias
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_corretores_updated_at
BEFORE UPDATE ON public.corretores
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_leads_updated_at
BEFORE UPDATE ON public.leads
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Triggers de auditoria
CREATE TRIGGER audit_imobiliarias
AFTER INSERT OR UPDATE OR DELETE ON public.imobiliarias
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

CREATE TRIGGER audit_corretores
AFTER INSERT OR UPDATE OR DELETE ON public.corretores
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

CREATE TRIGGER audit_leads
AFTER INSERT OR UPDATE OR DELETE ON public.leads
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

CREATE TRIGGER audit_lead_interactions
AFTER INSERT OR UPDATE OR DELETE ON public.lead_interactions
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

-- Inserir novos módulos
INSERT INTO public.modules (name, display_name, description, route, icon, is_active) VALUES
('imobiliarias', 'Imobiliárias', 'Gestão de imobiliárias parceiras', '/imobiliarias', 'Building', true),
('corretores', 'Corretores', 'Gestão de corretores', '/corretores', 'UserCheck', true),
('leads', 'Leads', 'Gestão de leads', '/leads', 'Users', true),
('abertura_mercado', 'Abertura de Mercado', 'Dashboard de abertura de mercado', '/abertura-mercado', 'TrendingUp', true);

-- Inserir permissões para Admin (já tem acesso total via is_admin)
-- Inserir permissões para Gestor de Produto
INSERT INTO public.role_permissions (role, module_id, can_view, can_create, can_edit, can_delete, scope)
SELECT 'gestor_produto', id, true, true, true, true, 'global'
FROM public.modules WHERE name IN ('imobiliarias', 'corretores', 'leads', 'abertura_mercado');

-- Inserir permissões para Incorporador (visualização)
INSERT INTO public.role_permissions (role, module_id, can_view, can_create, can_edit, can_delete, scope)
SELECT 'incorporador', id, true, false, false, false, 'empreendimento'
FROM public.modules WHERE name IN ('imobiliarias', 'corretores', 'leads', 'abertura_mercado');

-- Inserir permissões para Corretor (apenas próprios leads)
INSERT INTO public.role_permissions (role, module_id, can_view, can_create, can_edit, can_delete, scope)
SELECT 'corretor', id, true, true, true, false, 'proprio'
FROM public.modules WHERE name = 'leads';