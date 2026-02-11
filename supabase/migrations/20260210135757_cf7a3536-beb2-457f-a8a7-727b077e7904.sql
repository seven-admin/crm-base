
-- Fase 1: Migrar dados existentes
UPDATE public.atividades SET categoria = 'cliente' WHERE categoria IN ('primeiro_atendimento', 'retorno');
UPDATE public.atividades SET categoria = 'seven' WHERE categoria = 'interna';
UPDATE public.atividades SET categoria = 'imobiliaria' WHERE categoria = 'externa';
UPDATE public.atividades SET categoria = 'seven' WHERE categoria IS NULL;

-- Fase 2: Definir default e NOT NULL
ALTER TABLE public.atividades ALTER COLUMN categoria SET DEFAULT 'seven';
ALTER TABLE public.atividades ALTER COLUMN categoria SET NOT NULL;

-- Fase 3: Adicionar CHECK constraint
ALTER TABLE public.atividades ADD CONSTRAINT atividades_categoria_check CHECK (categoria IN ('seven', 'incorporadora', 'imobiliaria', 'cliente'));
