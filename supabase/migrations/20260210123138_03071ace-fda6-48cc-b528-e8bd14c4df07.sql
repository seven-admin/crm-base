
-- =============================================
-- FASE 1: Reestruturação Corretores/Imobiliárias
-- =============================================

-- 1.1 Nova role gestor_imobiliaria
INSERT INTO public.roles (name, display_name, description, is_system, is_active)
VALUES ('gestor_imobiliaria', 'Gestor de Imobiliária', 'Gerencia corretores da sua imobiliária', true, true)
ON CONFLICT DO NOTHING;

-- 1.2 Adicionar user_id na tabela imobiliarias (vincula gestor)
ALTER TABLE public.imobiliarias 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 1.3 Criar imobiliária padrão para corretores órfãos
INSERT INTO public.imobiliarias (id, nome, is_active)
VALUES ('00000000-0000-0000-0000-000000000001', 'SEM VÍNCULO (MIGRAÇÃO)', true)
ON CONFLICT (id) DO NOTHING;

-- 1.4 Vincular corretores órfãos à imobiliária padrão
UPDATE public.corretores 
SET imobiliaria_id = '00000000-0000-0000-0000-000000000001'
WHERE imobiliaria_id IS NULL;

-- 1.5 Tornar imobiliaria_id NOT NULL
ALTER TABLE public.corretores 
ALTER COLUMN imobiliaria_id SET NOT NULL;

-- 1.6 Atualizar user_has_empreendimento_access com acesso híbrido
CREATE OR REPLACE FUNCTION public.user_has_empreendimento_access(_user_id uuid, _empreendimento_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    public.is_admin(_user_id) 
    OR public.has_role(_user_id, 'gestor_produto')
    OR public.is_seven_team(_user_id)
    -- Vínculo individual (user_empreendimentos)
    OR EXISTS (
      SELECT 1 FROM public.user_empreendimentos
      WHERE user_id = _user_id 
        AND empreendimento_id = _empreendimento_id
    )
    -- NOVO: Acesso herdado via imobiliária (corretor ou gestor_imobiliaria)
    OR EXISTS (
      SELECT 1 
      FROM public.corretores c
      JOIN public.empreendimento_imobiliarias ei ON ei.imobiliaria_id = c.imobiliaria_id
      WHERE c.user_id = _user_id 
        AND ei.empreendimento_id = _empreendimento_id
    )
    OR EXISTS (
      SELECT 1 
      FROM public.imobiliarias i
      JOIN public.empreendimento_imobiliarias ei ON ei.imobiliaria_id = i.id
      WHERE i.user_id = _user_id 
        AND ei.empreendimento_id = _empreendimento_id
    )
$$;

-- 1.7 Função auxiliar: buscar imobiliária do usuário logado
CREATE OR REPLACE FUNCTION public.get_user_imobiliaria_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  -- Primeiro verifica se é gestor de imobiliária
  SELECT id FROM public.imobiliarias WHERE user_id = _user_id LIMIT 1
$$;

-- 1.8 Função: verificar se é gestor_imobiliaria
CREATE OR REPLACE FUNCTION public.is_gestor_imobiliaria(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.user_roles ur
    JOIN public.roles r ON r.id = ur.role_id
    WHERE ur.user_id = _user_id
    AND r.name = 'gestor_imobiliaria'
    AND r.is_active = true
  )
$$;

-- 1.9 RLS: Gestor da imobiliária pode gerenciar seus corretores
CREATE POLICY "Gestor imobiliaria can view own corretores"
ON public.corretores
FOR SELECT
TO authenticated
USING (
  public.is_gestor_imobiliaria(auth.uid()) 
  AND imobiliaria_id = public.get_user_imobiliaria_id(auth.uid())
);

CREATE POLICY "Gestor imobiliaria can insert own corretores"
ON public.corretores
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_gestor_imobiliaria(auth.uid()) 
  AND imobiliaria_id = public.get_user_imobiliaria_id(auth.uid())
);

CREATE POLICY "Gestor imobiliaria can update own corretores"
ON public.corretores
FOR UPDATE
TO authenticated
USING (
  public.is_gestor_imobiliaria(auth.uid()) 
  AND imobiliaria_id = public.get_user_imobiliaria_id(auth.uid())
);

-- 1.10 Permissões da role gestor_imobiliaria nos módulos
DO $$
DECLARE
  v_role_id uuid;
BEGIN
  SELECT id INTO v_role_id FROM public.roles WHERE name = 'gestor_imobiliaria';
  
  IF v_role_id IS NOT NULL THEN
    -- Corretores: view, create, edit (sem delete)
    INSERT INTO public.role_permissions (role_id, module_id, can_view, can_create, can_edit, can_delete, scope)
    SELECT v_role_id, id, true, true, true, false, 'proprio'
    FROM public.modules WHERE name = 'corretores'
    ON CONFLICT DO NOTHING;
    
    -- Empreendimentos: somente view
    INSERT INTO public.role_permissions (role_id, module_id, can_view, can_create, can_edit, can_delete, scope)
    SELECT v_role_id, id, true, false, false, false, 'empreendimento'
    FROM public.modules WHERE name = 'empreendimentos'
    ON CONFLICT DO NOTHING;
    
    -- Negociações: view e create
    INSERT INTO public.role_permissions (role_id, module_id, can_view, can_create, can_edit, can_delete, scope)
    SELECT v_role_id, id, true, true, false, false, 'empreendimento'
    FROM public.modules WHERE name = 'negociacoes'
    ON CONFLICT DO NOTHING;
    
    -- Clientes: view e create
    INSERT INTO public.role_permissions (role_id, module_id, can_view, can_create, can_edit, can_delete, scope)
    SELECT v_role_id, id, true, true, true, false, 'empreendimento'
    FROM public.modules WHERE name = 'clientes'
    ON CONFLICT DO NOTHING;
    
    -- Atividades: view e create
    INSERT INTO public.role_permissions (role_id, module_id, can_view, can_create, can_edit, can_delete, scope)
    SELECT v_role_id, id, true, true, true, false, 'empreendimento'
    FROM public.modules WHERE name = 'atividades'
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- 1.11 Atualizar is_seven_team para excluir gestor_imobiliaria
CREATE OR REPLACE FUNCTION public.is_seven_team(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.roles r ON r.id = ur.role_id
    WHERE ur.user_id = _user_id
      AND r.name NOT IN ('incorporador', 'corretor', 'cliente_externo', 'gestor_imobiliaria')
      AND r.is_active = true
  )
$$;
