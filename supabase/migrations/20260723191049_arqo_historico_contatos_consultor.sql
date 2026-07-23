-- Preserva a identidade de contato usada em cada atendimento. O snapshot
-- continua acessível ao consultor pela RLS de arqo_atendimentos mesmo depois
-- que o lead é liberado e deixa sua carteira.

ALTER TABLE public.arqo_atendimentos
  ADD COLUMN IF NOT EXISTS lead_nome_snapshot text,
  ADD COLUMN IF NOT EXISTS telefone_snapshot text,
  ADD COLUMN IF NOT EXISTS whatsapp_snapshot text,
  ADD COLUMN IF NOT EXISTS telefones_adicionais_snapshot text[] NOT NULL DEFAULT '{}'::text[];

UPDATE public.arqo_atendimentos atendimento
SET
  lead_nome_snapshot = cliente.nome,
  telefone_snapshot = cliente.telefone,
  whatsapp_snapshot = cliente.whatsapp,
  telefones_adicionais_snapshot = COALESCE(lead.telefones_adicionais, '{}'::text[])
FROM public.arqo_leads lead
JOIN public.seven_clientes cliente ON cliente.id = lead.cliente_id
WHERE atendimento.lead_id = lead.id
  AND atendimento.lead_nome_snapshot IS NULL;

CREATE OR REPLACE FUNCTION public.arqo_snapshot_contato_atendimento()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  SELECT
    cliente.nome,
    cliente.telefone,
    cliente.whatsapp,
    COALESCE(lead.telefones_adicionais, '{}'::text[])
  INTO
    NEW.lead_nome_snapshot,
    NEW.telefone_snapshot,
    NEW.whatsapp_snapshot,
    NEW.telefones_adicionais_snapshot
  FROM public.arqo_leads lead
  JOIN public.seven_clientes cliente ON cliente.id = lead.cliente_id
  WHERE lead.id = NEW.lead_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_arqo_atendimentos_snapshot_contato ON public.arqo_atendimentos;
CREATE TRIGGER trg_arqo_atendimentos_snapshot_contato
  BEFORE INSERT ON public.arqo_atendimentos
  FOR EACH ROW
  EXECUTE FUNCTION public.arqo_snapshot_contato_atendimento();
