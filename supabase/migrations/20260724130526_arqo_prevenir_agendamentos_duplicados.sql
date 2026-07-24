-- Preserva no histórico os agendamentos ativos repetidos antes de removê-los.
WITH duplicados AS (
  SELECT
    agendamento.*,
    row_number() OVER (
      PARTITION BY lead_id, tipo, data_hora
      ORDER BY created_at, id
    ) AS ordem_duplicidade
  FROM public.arqo_agendamentos agendamento
  WHERE status IN ('agendado', 'confirmado')
)
INSERT INTO public.arqo_lead_events (
  lead_id,
  tipo,
  usuario_id,
  payload,
  comentario
)
SELECT
  lead_id,
  'agendamento_duplicado_removido',
  responsavel_id,
  jsonb_build_object(
    'agendamento_id', id,
    'tipo', tipo,
    'data_hora', data_hora,
    'status', status,
    'observacoes', observacoes,
    'responsavel_id', responsavel_id,
    'closer_id', closer_id,
    'created_at', created_at
  ),
  'Agendamento ativo duplicado removido durante a correção de integridade'
FROM duplicados
WHERE ordem_duplicidade > 1;

WITH duplicados AS (
  SELECT
    id,
    row_number() OVER (
      PARTITION BY lead_id, tipo, data_hora
      ORDER BY created_at, id
    ) AS ordem_duplicidade
  FROM public.arqo_agendamentos
  WHERE status IN ('agendado', 'confirmado')
)
DELETE FROM public.arqo_agendamentos agendamento
USING duplicados
WHERE agendamento.id = duplicados.id
  AND duplicados.ordem_duplicidade > 1;

-- A unicidade no banco é a última linha de defesa contra concorrência.
CREATE UNIQUE INDEX IF NOT EXISTS uq_arqo_agendamento_ativo_lead_tipo_data
  ON public.arqo_agendamentos (lead_id, tipo, data_hora)
  WHERE status IN ('agendado', 'confirmado');

-- Evita que uma repetição normal da mesma ação invalide todo o atendimento.
-- O lock transacional serializa duas tentativas simultâneas para a mesma chave.
CREATE OR REPLACE FUNCTION public.arqo_prevenir_agendamento_duplicado()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.status NOT IN ('agendado', 'confirmado') THEN
    RETURN NEW;
  END IF;

  PERFORM pg_advisory_xact_lock(
    hashtextextended(
      NEW.lead_id::text || '|' || NEW.tipo || '|' || extract(epoch FROM NEW.data_hora)::text,
      0
    )
  );

  IF EXISTS (
    SELECT 1
    FROM public.arqo_agendamentos existente
    WHERE existente.lead_id = NEW.lead_id
      AND existente.tipo = NEW.tipo
      AND existente.data_hora = NEW.data_hora
      AND existente.status IN ('agendado', 'confirmado')
      AND existente.id IS DISTINCT FROM NEW.id
  ) THEN
    RETURN NULL;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.arqo_prevenir_agendamento_duplicado() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_arqo_agendamento_prevenir_duplicado ON public.arqo_agendamentos;
CREATE TRIGGER trg_arqo_agendamento_prevenir_duplicado
  BEFORE INSERT ON public.arqo_agendamentos
  FOR EACH ROW
  EXECUTE FUNCTION public.arqo_prevenir_agendamento_duplicado();
