-- Agenda própria da Seven: atividades criadas pelos usuários Seven (empresa='seven')
-- para aparecerem no calendário consolidado ao lado de Arqo e Nexa.

CREATE TABLE IF NOT EXISTS public.seven_atividades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL,
  data_hora timestamptz NOT NULL,
  local text,
  observacoes text,
  responsavel_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_by uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE SET NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_seven_atividades_data ON public.seven_atividades (data_hora) WHERE is_active;

-- "Usuário Seven" = admin ou perfil com empresa='seven'.
CREATE OR REPLACE FUNCTION public.is_seven_user()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.is_admin(auth.uid()) OR EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.empresa = 'seven'
  );
$$;

ALTER TABLE public.seven_atividades ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS seven_atividades_select ON public.seven_atividades;
CREATE POLICY seven_atividades_select ON public.seven_atividades
  FOR SELECT USING (public.is_seven_user());

DROP POLICY IF EXISTS seven_atividades_insert ON public.seven_atividades;
CREATE POLICY seven_atividades_insert ON public.seven_atividades
  FOR INSERT WITH CHECK (public.is_seven_user() AND created_by = auth.uid());

DROP POLICY IF EXISTS seven_atividades_update ON public.seven_atividades;
CREATE POLICY seven_atividades_update ON public.seven_atividades
  FOR UPDATE USING (public.is_admin(auth.uid()) OR created_by = auth.uid());

DROP POLICY IF EXISTS seven_atividades_delete ON public.seven_atividades;
CREATE POLICY seven_atividades_delete ON public.seven_atividades
  FOR DELETE USING (public.is_admin(auth.uid()) OR created_by = auth.uid());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.seven_atividades TO authenticated;
