-- Adiciona campos para criador e prazo (date-only)
ALTER TABLE public.atividades
ADD COLUMN IF NOT EXISTS created_by uuid,
ADD COLUMN IF NOT EXISTS deadline_date date;

-- Índices para performance de filtros/prazo
CREATE INDEX IF NOT EXISTS idx_atividades_gestor_id ON public.atividades (gestor_id);
CREATE INDEX IF NOT EXISTS idx_atividades_created_by ON public.atividades (created_by);
CREATE INDEX IF NOT EXISTS idx_atividades_deadline_date ON public.atividades (deadline_date);

-- Preencher created_by automaticamente na criação (evita precisar mudar todos os inserts no frontend)
CREATE OR REPLACE FUNCTION public.set_atividade_created_by()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.created_by IS NULL THEN
    NEW.created_by := auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_atividade_created_by ON public.atividades;
CREATE TRIGGER trg_set_atividade_created_by
BEFORE INSERT ON public.atividades
FOR EACH ROW
EXECUTE FUNCTION public.set_atividade_created_by();

-- Backfill opcional: manter nulo para histórico (evita assumir criador incorreto)
-- UPDATE public.atividades SET created_by = auth.uid() WHERE created_by IS NULL;  -- não aplicamos
