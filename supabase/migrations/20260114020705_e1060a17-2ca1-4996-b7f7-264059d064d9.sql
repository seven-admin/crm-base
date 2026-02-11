-- =============================================
-- 1. Adicionar coluna empreendimento_id na tabela clientes
-- =============================================

ALTER TABLE public.clientes 
ADD COLUMN IF NOT EXISTS empreendimento_id uuid REFERENCES empreendimentos(id);

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_clientes_empreendimento ON clientes(empreendimento_id);

-- =============================================
-- 2. Função para buscar gestor de produto do empreendimento
-- =============================================

CREATE OR REPLACE FUNCTION public.get_gestor_empreendimento(emp_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ue.user_id
  FROM public.user_empreendimentos ue
  INNER JOIN public.user_roles ur ON ue.user_id = ur.user_id
  INNER JOIN public.roles r ON ur.role_id = r.id
  WHERE ue.empreendimento_id = emp_id
    AND r.name = 'gestor_produto'
    AND r.is_active = true
  LIMIT 1;
$$;