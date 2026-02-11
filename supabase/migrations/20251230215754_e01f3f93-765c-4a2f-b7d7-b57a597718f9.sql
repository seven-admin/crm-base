-- Create table for system configurations
CREATE TABLE public.configuracoes_sistema (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chave text NOT NULL UNIQUE,
  valor text NOT NULL,
  categoria text NOT NULL DEFAULT 'geral',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.configuracoes_sistema ENABLE ROW LEVEL SECURITY;

-- Anyone can read configs (needed for login page)
CREATE POLICY "Anyone can view configuracoes_sistema"
ON public.configuracoes_sistema
FOR SELECT
USING (true);

-- Only admins can manage configs
CREATE POLICY "Admins can manage configuracoes_sistema"
ON public.configuracoes_sistema
FOR ALL
USING (is_admin(auth.uid()));

-- Add trigger for updated_at
CREATE TRIGGER update_configuracoes_sistema_updated_at
BEFORE UPDATE ON public.configuracoes_sistema
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default values
INSERT INTO public.configuracoes_sistema (chave, valor, categoria) VALUES
  ('login_feature_1', 'Gestão de Empreendimentos', 'login'),
  ('login_feature_2', 'Controle de Vendas e Propostas', 'login'),
  ('login_feature_3', 'Funil de Negociações', 'login'),
  ('copyright_texto', '2024 Seven Group. Todos os direitos reservados.', 'geral');