-- NEXA · funde nexa_visitas em nexa_atividades (tabela única que já alimenta as Metas).
-- Idempotente (IF EXISTS/IF NOT EXISTS/ON CONFLICT) para ser reaplicável com segurança.

-- 1) Campos do "Atendimento (cliente)" em nexa_atividades (todos opcionais).
ALTER TABLE public.nexa_atividades
  ADD COLUMN IF NOT EXISTS cliente_id uuid REFERENCES public.seven_clientes(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS visitante_nome text,
  ADD COLUMN IF NOT EXISTS visitante_telefone text,
  ADD COLUMN IF NOT EXISTS empreendimento_id uuid REFERENCES public.seven_empreendimentos(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS imobiliaria_id uuid REFERENCES public.seven_imobiliarias(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS corretor_id uuid REFERENCES public.seven_corretores(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS status public.nexa_visita_status;

CREATE INDEX IF NOT EXISTS idx_nexa_atividades_empreendimento
  ON public.nexa_atividades(empreendimento_id);

-- 2) Migra as visitas existentes preservando o id (para os eventos continuarem válidos).
INSERT INTO public.nexa_atividades
  (id, tipo, data_hora, observacoes, created_by, created_at, updated_at,
   cliente_id, visitante_nome, visitante_telefone, empreendimento_id, imobiliaria_id, corretor_id, status)
SELECT
  v.id, 'atendimento', v.data_hora, v.observacoes, v.created_by, v.created_at, v.updated_at,
  v.cliente_id, v.visitante_nome, v.visitante_telefone, v.empreendimento_id,
  v.imobiliaria_parceira_id, v.corretor_id, v.status
FROM public.nexa_visitas v
ON CONFLICT (id) DO NOTHING;

-- 3) Repontar o FK dos eventos para nexa_atividades (ids preservados => histórico intacto).
DO $$
DECLARE c text;
BEGIN
  SELECT conname INTO c FROM pg_constraint
  WHERE conrelid = 'public.nexa_visitas_eventos'::regclass AND contype = 'f'
    AND conkey = (SELECT array_agg(attnum) FROM pg_attribute
                  WHERE attrelid = 'public.nexa_visitas_eventos'::regclass AND attname = 'visita_id');
  IF c IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.nexa_visitas_eventos DROP CONSTRAINT %I', c);
  END IF;
END $$;

ALTER TABLE public.nexa_visitas_eventos
  ADD CONSTRAINT nexa_visitas_eventos_atividade_fkey
  FOREIGN KEY (visita_id) REFERENCES public.nexa_atividades(id) ON DELETE CASCADE;
