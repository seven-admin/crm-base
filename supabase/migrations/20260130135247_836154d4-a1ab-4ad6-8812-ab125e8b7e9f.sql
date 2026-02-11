-- Tabela de relacionamento N:N para múltiplos responsáveis
CREATE TABLE public.planejamento_item_responsaveis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL REFERENCES public.planejamento_itens(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  papel text DEFAULT 'responsavel',
  created_at timestamptz DEFAULT now(),
  UNIQUE(item_id, user_id)
);

-- Migrar dados existentes de responsavel_tecnico_id
INSERT INTO public.planejamento_item_responsaveis (item_id, user_id, papel)
SELECT id, responsavel_tecnico_id, 'principal'
FROM public.planejamento_itens
WHERE responsavel_tecnico_id IS NOT NULL;

-- Habilitar RLS
ALTER TABLE public.planejamento_item_responsaveis ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Leitura liberada para autenticados"
ON public.planejamento_item_responsaveis
FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Admins podem inserir responsaveis"
ON public.planejamento_item_responsaveis
FOR INSERT TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins podem atualizar responsaveis"
ON public.planejamento_item_responsaveis
FOR UPDATE TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins podem deletar responsaveis"
ON public.planejamento_item_responsaveis
FOR DELETE TO authenticated
USING (public.is_admin(auth.uid()));

-- Índice para performance
CREATE INDEX idx_planejamento_item_responsaveis_item_id 
ON public.planejamento_item_responsaveis(item_id);

CREATE INDEX idx_planejamento_item_responsaveis_user_id 
ON public.planejamento_item_responsaveis(user_id);