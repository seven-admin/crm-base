-- FASE 4: Migrar de ENUM app_role para tabela roles
-- PARTE 1: Criar estrutura de tabela e popular dados

-- 1. Criar tabela roles
CREATE TABLE public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_system BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Habilitar RLS
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

-- 3. Políticas RLS para roles
CREATE POLICY "Anyone can view active roles" ON public.roles
FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage roles" ON public.roles
FOR ALL USING (is_admin(auth.uid()));

-- 4. Inserir roles existentes do ENUM
INSERT INTO public.roles (name, display_name, description, is_system) VALUES
  ('super_admin', 'Super Administrador', 'Acesso total ao sistema', true),
  ('admin', 'Administrador', 'Administração geral do sistema', true),
  ('gestor_produto', 'Gestor de Produto', 'Gestão de empreendimentos e vendas', true),
  ('incorporador', 'Incorporador', 'Cliente incorporador com acesso a seus empreendimentos', false),
  ('corretor', 'Corretor', 'Corretor de imóveis', false),
  ('supervisor_relacionamento', 'Supervisor de Relacionamento', 'Supervisão da área de relacionamento', true),
  ('supervisor_render', 'Supervisor de Render', 'Supervisão da área de render', true),
  ('supervisor_criacao', 'Supervisor de Criação', 'Supervisão da área de criação', true),
  ('supervisor_video', 'Supervisor de Vídeo', 'Supervisão da área de vídeo', true),
  ('equipe_marketing', 'Equipe de Marketing', 'Membro da equipe de marketing', true),
  ('cliente_externo', 'Cliente Externo', 'Cliente externo com acesso limitado', false);

-- 5. Adicionar coluna role_id à tabela user_roles (mantendo role antigo temporariamente)
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS role_id UUID REFERENCES public.roles(id);

-- 6. Migrar dados: popular role_id baseado no role existente
UPDATE public.user_roles ur
SET role_id = r.id
FROM public.roles r
WHERE ur.role::text = r.name;

-- 7. Adicionar coluna role_id à tabela role_permissions
ALTER TABLE public.role_permissions ADD COLUMN IF NOT EXISTS role_id UUID REFERENCES public.roles(id);

-- 8. Migrar dados de role_permissions
UPDATE public.role_permissions rp
SET role_id = r.id
FROM public.roles r
WHERE rp.role::text = r.name;

-- 9. Criar trigger para updated_at
CREATE TRIGGER update_roles_updated_at
BEFORE UPDATE ON public.roles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();