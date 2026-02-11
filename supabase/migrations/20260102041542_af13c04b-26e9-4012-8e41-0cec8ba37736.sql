-- FASE 2: Templates de Eventos

-- Tabela de templates de eventos
CREATE TABLE evento_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT,
  duracao_dias INTEGER DEFAULT 1,
  orcamento_padrao NUMERIC DEFAULT 0,
  local_padrao TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tarefas predefinidas do template
CREATE TABLE evento_template_tarefas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES evento_templates(id) ON DELETE CASCADE NOT NULL,
  titulo TEXT NOT NULL,
  descricao TEXT,
  dias_antes_evento INTEGER DEFAULT 0, -- negativo = antes do evento, 0 = no dia, positivo = depois
  duracao_horas INTEGER DEFAULT 24,
  ordem INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS para evento_templates
ALTER TABLE evento_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage evento_templates"
ON evento_templates FOR ALL
USING (is_admin(auth.uid()));

CREATE POLICY "Gestores can manage evento_templates"
ON evento_templates FOR ALL
USING (has_role(auth.uid(), 'gestor_produto'));

CREATE POLICY "Users can view active evento_templates"
ON evento_templates FOR SELECT
USING (is_active = true);

-- RLS para evento_template_tarefas
ALTER TABLE evento_template_tarefas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage evento_template_tarefas"
ON evento_template_tarefas FOR ALL
USING (is_admin(auth.uid()));

CREATE POLICY "Gestores can manage evento_template_tarefas"
ON evento_template_tarefas FOR ALL
USING (has_role(auth.uid(), 'gestor_produto'));

CREATE POLICY "Users can view evento_template_tarefas"
ON evento_template_tarefas FOR SELECT
USING (EXISTS (
  SELECT 1 FROM evento_templates t 
  WHERE t.id = evento_template_tarefas.template_id 
  AND t.is_active = true
));

-- Trigger para updated_at
CREATE TRIGGER update_evento_templates_updated_at
BEFORE UPDATE ON evento_templates
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();