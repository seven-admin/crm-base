-- Tabela para imagens dos templates de contrato
CREATE TABLE public.contrato_template_imagens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.contrato_templates(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  arquivo_url TEXT NOT NULL,
  largura INTEGER,
  altura INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.contrato_template_imagens ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage contrato_template_imagens" ON public.contrato_template_imagens
  FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Gestores can manage contrato_template_imagens" ON public.contrato_template_imagens
  FOR ALL USING (has_role(auth.uid(), 'gestor_produto'));

CREATE POLICY "Users can view contrato_template_imagens" ON public.contrato_template_imagens
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM contrato_templates t 
      WHERE t.id = contrato_template_imagens.template_id 
      AND t.is_active = true
    )
  );

CREATE POLICY "Users can insert contrato_template_imagens" ON public.contrato_template_imagens
  FOR INSERT WITH CHECK (true);

-- Tabela para variáveis dinâmicas de contrato
CREATE TABLE public.contrato_variaveis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chave TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  exemplo TEXT,
  categoria TEXT DEFAULT 'geral',
  tipo TEXT DEFAULT 'texto', -- texto, data, moeda, numero
  origem TEXT, -- cliente, empreendimento, unidade, contrato, sistema
  campo_origem TEXT, -- nome do campo na tabela de origem
  is_sistema BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.contrato_variaveis ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage contrato_variaveis" ON public.contrato_variaveis
  FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Gestores can manage contrato_variaveis" ON public.contrato_variaveis
  FOR ALL USING (has_role(auth.uid(), 'gestor_produto'));

CREATE POLICY "Users can view active contrato_variaveis" ON public.contrato_variaveis
  FOR SELECT USING (is_active = true);

-- Trigger para updated_at
CREATE TRIGGER update_contrato_variaveis_updated_at
  BEFORE UPDATE ON public.contrato_variaveis
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir variáveis padrão do sistema
INSERT INTO public.contrato_variaveis (chave, label, exemplo, categoria, origem, campo_origem, is_sistema) VALUES
-- Cliente
('nome_cliente', 'Nome do Cliente', 'João da Silva', 'cliente', 'clientes', 'nome', true),
('cpf', 'CPF do Cliente', '000.000.000-00', 'cliente', 'clientes', 'cpf', true),
('rg', 'RG do Cliente', '00.000.000-0', 'cliente', 'clientes', 'rg', true),
('endereco_cliente', 'Endereço Completo do Cliente', 'Rua das Flores, 123 - Centro - São Paulo/SP', 'cliente', 'clientes', 'endereco_completo', true),
('telefone_cliente', 'Telefone do Cliente', '(11) 99999-9999', 'cliente', 'clientes', 'telefone', true),
('email_cliente', 'E-mail do Cliente', 'cliente@email.com', 'cliente', 'clientes', 'email', true),
('profissao_cliente', 'Profissão do Cliente', 'Empresário', 'cliente', 'clientes', 'profissao', true),
-- Empreendimento
('empreendimento', 'Nome do Empreendimento', 'Residencial Vista Mar', 'empreendimento', 'empreendimentos', 'nome', true),
('endereco_empreendimento', 'Endereço do Empreendimento', 'Av. Beira Mar, 1000 - Praia Grande/SP', 'empreendimento', 'empreendimentos', 'endereco_completo', true),
('incorporadora', 'Nome da Incorporadora', 'Construtora ABC Ltda', 'empreendimento', 'empreendimentos', 'incorporadora', true),
('construtora', 'Nome da Construtora', 'Construtora XYZ S.A.', 'empreendimento', 'empreendimentos', 'construtora', true),
('matricula_mae', 'Matrícula Mãe', '123.456', 'empreendimento', 'empreendimentos', 'matricula_mae', true),
('registro_incorporacao', 'Registro de Incorporação', 'RI-2024-001', 'empreendimento', 'empreendimentos', 'registro_incorporacao', true),
-- Unidade
('unidade', 'Identificação da Unidade', 'Apt 101', 'unidade', 'unidades', 'identificador', true),
('bloco', 'Bloco/Torre', 'Torre A', 'unidade', 'blocos', 'nome', true),
('area_privativa', 'Área Privativa (m²)', '65,50', 'unidade', 'unidades', 'area_privativa', true),
('area_total', 'Área Total (m²)', '85,00', 'unidade', 'unidades', 'area_total', true),
('matricula_unidade', 'Matrícula da Unidade', '789.012', 'unidade', 'unidades', 'matricula', true),
-- Contrato
('numero_contrato', 'Número do Contrato', 'CONT-00001', 'contrato', 'contratos', 'numero', true),
('valor_contrato', 'Valor do Contrato', 'R$ 350.000,00', 'contrato', 'contratos', 'valor_contrato', true),
('data_contrato', 'Data do Contrato', '15 de janeiro de 2025', 'contrato', 'contratos', 'data_geracao', true),
-- Sistema
('data_atual', 'Data Atual', '31 de dezembro de 2024', 'sistema', null, null, true),
('data_atual_extenso', 'Data Atual por Extenso', 'trinta e um de dezembro de dois mil e vinte e quatro', 'sistema', null, null, true);