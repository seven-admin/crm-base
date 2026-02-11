-- ==============================================
-- PARTE 3: RLS, POLÍTICAS E MÓDULOS
-- ==============================================

-- Enable RLS em todas as tabelas
ALTER TABLE projetos_marketing ENABLE ROW LEVEL SECURITY;
ALTER TABLE tarefas_projeto ENABLE ROW LEVEL SECURITY;
ALTER TABLE projeto_historico ENABLE ROW LEVEL SECURITY;
ALTER TABLE projeto_comentarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE eventos ENABLE ROW LEVEL SECURITY;
ALTER TABLE evento_tarefas ENABLE ROW LEVEL SECURITY;

-- Função helper para verificar se é supervisor de marketing
CREATE OR REPLACE FUNCTION is_marketing_supervisor(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = _user_id
    AND role IN ('supervisor_relacionamento', 'supervisor_render', 'supervisor_criacao', 'supervisor_video', 'equipe_marketing')
  )
$$;

-- Função para verificar se é cliente externo
CREATE OR REPLACE FUNCTION is_cliente_externo(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT public.has_role(_user_id, 'cliente_externo')
$$;

-- ==============================================
-- PROJETOS MARKETING POLICIES
-- ==============================================

CREATE POLICY "Admins can manage projetos_marketing"
  ON projetos_marketing FOR ALL
  USING (is_admin(auth.uid()));

CREATE POLICY "Supervisores can manage projetos_marketing"
  ON projetos_marketing FOR ALL
  USING (is_marketing_supervisor(auth.uid()));

CREATE POLICY "Clientes can view own projetos"
  ON projetos_marketing FOR SELECT
  USING (cliente_id = auth.uid());

CREATE POLICY "Clientes can create projetos"
  ON projetos_marketing FOR INSERT
  WITH CHECK (is_cliente_externo(auth.uid()) AND cliente_id = auth.uid());

-- ==============================================
-- TAREFAS PROJETO POLICIES
-- ==============================================

CREATE POLICY "Admins can manage tarefas_projeto"
  ON tarefas_projeto FOR ALL
  USING (is_admin(auth.uid()));

CREATE POLICY "Supervisores can manage tarefas_projeto"
  ON tarefas_projeto FOR ALL
  USING (is_marketing_supervisor(auth.uid()));

CREATE POLICY "Users can view tarefas of visible projetos"
  ON tarefas_projeto FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM projetos_marketing pm 
    WHERE pm.id = tarefas_projeto.projeto_id 
    AND (pm.cliente_id = auth.uid() OR is_admin(auth.uid()) OR is_marketing_supervisor(auth.uid()))
  ));

-- ==============================================
-- PROJETO HISTORICO POLICIES
-- ==============================================

CREATE POLICY "Admins can manage projeto_historico"
  ON projeto_historico FOR ALL
  USING (is_admin(auth.uid()));

CREATE POLICY "Supervisores can manage projeto_historico"
  ON projeto_historico FOR ALL
  USING (is_marketing_supervisor(auth.uid()));

CREATE POLICY "Users can view historico of visible projetos"
  ON projeto_historico FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM projetos_marketing pm 
    WHERE pm.id = projeto_historico.projeto_id 
    AND (pm.cliente_id = auth.uid() OR is_admin(auth.uid()) OR is_marketing_supervisor(auth.uid()))
  ));

-- ==============================================
-- PROJETO COMENTARIOS POLICIES
-- ==============================================

CREATE POLICY "Admins can manage projeto_comentarios"
  ON projeto_comentarios FOR ALL
  USING (is_admin(auth.uid()));

CREATE POLICY "Supervisores can manage projeto_comentarios"
  ON projeto_comentarios FOR ALL
  USING (is_marketing_supervisor(auth.uid()));

CREATE POLICY "Users can view comentarios of visible projetos"
  ON projeto_comentarios FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM projetos_marketing pm 
    WHERE pm.id = projeto_comentarios.projeto_id 
    AND (pm.cliente_id = auth.uid() OR is_admin(auth.uid()) OR is_marketing_supervisor(auth.uid()))
  ));

CREATE POLICY "Users can create comentarios on visible projetos"
  ON projeto_comentarios FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM projetos_marketing pm 
    WHERE pm.id = projeto_comentarios.projeto_id 
    AND (pm.cliente_id = auth.uid() OR is_admin(auth.uid()) OR is_marketing_supervisor(auth.uid()))
  ));

-- ==============================================
-- EVENTOS POLICIES
-- ==============================================

CREATE POLICY "Admins can manage eventos"
  ON eventos FOR ALL
  USING (is_admin(auth.uid()));

CREATE POLICY "Supervisores can view eventos"
  ON eventos FOR SELECT
  USING (is_marketing_supervisor(auth.uid()));

CREATE POLICY "Supervisor relacionamento can manage eventos"
  ON eventos FOR ALL
  USING (has_role(auth.uid(), 'supervisor_relacionamento'));

-- ==============================================
-- EVENTO TAREFAS POLICIES
-- ==============================================

CREATE POLICY "Admins can manage evento_tarefas"
  ON evento_tarefas FOR ALL
  USING (is_admin(auth.uid()));

CREATE POLICY "Supervisores can view evento_tarefas"
  ON evento_tarefas FOR SELECT
  USING (is_marketing_supervisor(auth.uid()));

CREATE POLICY "Supervisor relacionamento can manage evento_tarefas"
  ON evento_tarefas FOR ALL
  USING (has_role(auth.uid(), 'supervisor_relacionamento'));

-- ==============================================
-- REGISTRAR NOVOS MÓDULOS
-- ==============================================

INSERT INTO modules (name, display_name, description, icon, route, is_active) VALUES
('projetos_marketing', 'Projetos Marketing', 'Gestão de projetos de criação e marketing', 'Palette', '/marketing', true),
('portal_cliente', 'Portal do Cliente', 'Portal para clientes solicitarem trabalhos', 'FileEdit', '/portal-cliente', true),
('eventos', 'Eventos', 'Gestão de eventos corporativos', 'CalendarDays', '/eventos', true)
ON CONFLICT (name) DO NOTHING;

-- ==============================================
-- STORAGE BUCKET
-- ==============================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('projetos-arquivos', 'projetos-arquivos', false)
ON CONFLICT (id) DO NOTHING;

-- Políticas do bucket
CREATE POLICY "Authenticated users can upload project files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'projetos-arquivos' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can view project files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'projetos-arquivos' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Admins can delete project files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'projetos-arquivos' 
  AND is_admin(auth.uid())
);