-- =====================================================
-- ETAPA: CRUD de Funis e Etapas Configuráveis
-- =====================================================

-- Tabela de funis (permite ter diferentes funis para diferentes empreendimentos)
CREATE TABLE public.funis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  descricao text,
  empreendimento_id uuid REFERENCES public.empreendimentos(id) ON DELETE SET NULL,
  is_default boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de etapas dos funis
CREATE TABLE public.funil_etapas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  funil_id uuid REFERENCES public.funis(id) ON DELETE CASCADE NOT NULL,
  nome text NOT NULL,
  codigo text NOT NULL,
  cor text NOT NULL DEFAULT '#6b7280',
  cor_bg text DEFAULT '#f3f4f6',
  icone text,
  ordem integer NOT NULL DEFAULT 0,
  is_inicial boolean DEFAULT false,
  is_final_sucesso boolean DEFAULT false,
  is_final_perda boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Adicionar coluna para vincular negociação à etapa dinâmica
ALTER TABLE public.negociacoes 
ADD COLUMN funil_etapa_id uuid REFERENCES public.funil_etapas(id) ON DELETE SET NULL;

-- Índices
CREATE INDEX idx_funis_empreendimento ON public.funis(empreendimento_id);
CREATE INDEX idx_funis_default ON public.funis(is_default) WHERE is_default = true;
CREATE INDEX idx_funil_etapas_funil ON public.funil_etapas(funil_id);
CREATE INDEX idx_funil_etapas_ordem ON public.funil_etapas(funil_id, ordem);
CREATE INDEX idx_negociacoes_funil_etapa ON public.negociacoes(funil_etapa_id);

-- Trigger para updated_at
CREATE TRIGGER update_funis_updated_at
  BEFORE UPDATE ON public.funis
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar RLS
ALTER TABLE public.funis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funil_etapas ENABLE ROW LEVEL SECURITY;

-- Policies para funis
CREATE POLICY "Admins can manage funis"
  ON public.funis FOR ALL
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Gestores can manage funis"
  ON public.funis FOR ALL
  USING (public.has_role(auth.uid(), 'gestor_produto'));

CREATE POLICY "Users can view funis"
  ON public.funis FOR SELECT
  USING (
    is_active = true AND (
      empreendimento_id IS NULL OR
      public.user_has_empreendimento_access(auth.uid(), empreendimento_id)
    )
  );

-- Policies para funil_etapas
CREATE POLICY "Admins can manage funil_etapas"
  ON public.funil_etapas FOR ALL
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Gestores can manage funil_etapas"
  ON public.funil_etapas FOR ALL
  USING (public.has_role(auth.uid(), 'gestor_produto'));

CREATE POLICY "Users can view funil_etapas"
  ON public.funil_etapas FOR SELECT
  USING (
    is_active = true AND
    EXISTS (
      SELECT 1 FROM public.funis f
      WHERE f.id = funil_etapas.funil_id
      AND f.is_active = true
    )
  );

-- Inserir funil padrão com as etapas atuais
INSERT INTO public.funis (id, nome, descricao, is_default, is_active)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'Funil Padrão',
  'Funil de vendas padrão do sistema com 6 etapas',
  true,
  true
);

-- Inserir etapas do funil padrão (baseado no enum existente)
INSERT INTO public.funil_etapas (funil_id, nome, codigo, cor, cor_bg, ordem, is_inicial, is_final_sucesso, is_final_perda)
VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Lead', 'lead', '#6b7280', '#f3f4f6', 0, true, false, false),
  ('a0000000-0000-0000-0000-000000000001', 'Atendimento', 'atendimento', '#3b82f6', '#dbeafe', 1, false, false, false),
  ('a0000000-0000-0000-0000-000000000001', 'Proposta', 'proposta', '#f59e0b', '#fef3c7', 2, false, false, false),
  ('a0000000-0000-0000-0000-000000000001', 'Negociação', 'negociacao', '#8b5cf6', '#ede9fe', 3, false, false, false),
  ('a0000000-0000-0000-0000-000000000001', 'Fechado', 'fechado', '#22c55e', '#dcfce7', 4, false, true, false),
  ('a0000000-0000-0000-0000-000000000001', 'Perdido', 'perdido', '#ef4444', '#fee2e2', 5, false, false, true);

-- Inserir módulo de configuração de funis
INSERT INTO public.modules (name, display_name, description, icon, route, is_active)
VALUES ('config_funis', 'Configuração de Funis', 'Gerenciamento de funis e etapas de vendas', 'GitBranch', '/configuracoes/funis', true);

-- Permissões para config_funis
INSERT INTO public.role_permissions (role, module_id, can_view, can_create, can_edit, can_delete, scope)
SELECT 'admin', id, true, true, true, true, 'global'
FROM public.modules WHERE name = 'config_funis';

INSERT INTO public.role_permissions (role, module_id, can_view, can_create, can_edit, can_delete, scope)
SELECT 'gestor_produto', id, true, true, true, true, 'global'
FROM public.modules WHERE name = 'config_funis';