-- ==============================================
-- PARTE 2: TABELAS E ESTRUTURA
-- ==============================================

-- Criar ENUMs para projetos marketing
CREATE TYPE categoria_projeto AS ENUM (
  'render_3d', 'design_grafico', 'video_animacao', 'evento'
);

CREATE TYPE status_projeto AS ENUM (
  'briefing', 'triagem', 'em_producao', 'revisao', 
  'aprovacao_cliente', 'concluido', 'arquivado'
);

CREATE TYPE prioridade_projeto AS ENUM (
  'baixa', 'media', 'alta', 'urgente'
);

-- Sequências para códigos
CREATE SEQUENCE IF NOT EXISTS projeto_codigo_seq START 1;
CREATE SEQUENCE IF NOT EXISTS evento_codigo_seq START 1;

-- Tabela principal de projetos marketing
CREATE TABLE projetos_marketing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT NOT NULL,
  titulo TEXT NOT NULL,
  descricao TEXT,
  categoria categoria_projeto NOT NULL,
  status status_projeto DEFAULT 'briefing',
  prioridade prioridade_projeto DEFAULT 'media',
  
  cliente_id UUID REFERENCES profiles(id),
  supervisor_id UUID REFERENCES profiles(id),
  empreendimento_id UUID REFERENCES empreendimentos(id),
  
  data_solicitacao DATE DEFAULT CURRENT_DATE,
  data_inicio DATE,
  data_previsao DATE,
  data_entrega DATE,
  
  briefing_texto TEXT,
  briefing_anexos JSONB DEFAULT '[]'::jsonb,
  
  ordem_kanban INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Trigger para gerar código automaticamente
CREATE OR REPLACE FUNCTION generate_projeto_codigo()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  NEW.codigo := 'MKT-' || LPAD(nextval('projeto_codigo_seq')::TEXT, 5, '0');
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_projeto_codigo
  BEFORE INSERT ON projetos_marketing
  FOR EACH ROW
  EXECUTE FUNCTION generate_projeto_codigo();

CREATE TRIGGER update_projetos_marketing_updated_at
  BEFORE UPDATE ON projetos_marketing
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Tarefas do projeto
CREATE TABLE tarefas_projeto (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  projeto_id UUID REFERENCES projetos_marketing(id) ON DELETE CASCADE NOT NULL,
  titulo TEXT NOT NULL,
  descricao TEXT,
  responsavel_id UUID REFERENCES profiles(id),
  status TEXT DEFAULT 'pendente',
  data_inicio DATE,
  data_fim DATE,
  ordem INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER update_tarefas_projeto_updated_at
  BEFORE UPDATE ON tarefas_projeto
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Histórico de movimentações
CREATE TABLE projeto_historico (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  projeto_id UUID REFERENCES projetos_marketing(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id),
  status_anterior status_projeto,
  status_novo status_projeto NOT NULL,
  observacao TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Comentários/Feedback
CREATE TABLE projeto_comentarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  projeto_id UUID REFERENCES projetos_marketing(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id),
  comentario TEXT NOT NULL,
  anexo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de Eventos
CREATE TABLE eventos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT NOT NULL,
  nome TEXT NOT NULL,
  descricao TEXT,
  empreendimento_id UUID REFERENCES empreendimentos(id),
  
  data_evento DATE NOT NULL,
  local TEXT,
  
  responsavel_id UUID REFERENCES profiles(id),
  status TEXT DEFAULT 'planejamento',
  
  orcamento NUMERIC,
  
  created_by UUID REFERENCES profiles(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Trigger para gerar código do evento
CREATE OR REPLACE FUNCTION generate_evento_codigo()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  NEW.codigo := 'EVT-' || LPAD(nextval('evento_codigo_seq')::TEXT, 5, '0');
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_evento_codigo
  BEFORE INSERT ON eventos
  FOR EACH ROW
  EXECUTE FUNCTION generate_evento_codigo();

CREATE TRIGGER update_eventos_updated_at
  BEFORE UPDATE ON eventos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Tarefas do evento
CREATE TABLE evento_tarefas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evento_id UUID REFERENCES eventos(id) ON DELETE CASCADE NOT NULL,
  titulo TEXT NOT NULL,
  responsavel_id UUID REFERENCES profiles(id),
  data_inicio DATE,
  data_fim DATE,
  status TEXT DEFAULT 'pendente',
  dependencia_id UUID REFERENCES evento_tarefas(id),
  ordem INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER update_evento_tarefas_updated_at
  BEFORE UPDATE ON evento_tarefas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();