-- Permite atividades (agendamentos) da Arqo sem vínculo com lead.
-- Antes: lead_id era obrigatório, o closer vinha sempre do grupo do lead,
-- a prevenção de duplicidade dependia do lead e o RLS só enxergava a atividade
-- através do lead. Agora o funcionário pode lançar uma visita/reunião/ligação/outro
-- avulsa (sem lead), e ainda assim vê e gerencia a própria atividade.

-- 1) lead_id passa a ser opcional
ALTER TABLE public.arqo_agendamentos
  ALTER COLUMN lead_id DROP NOT NULL;

-- 2) Closer só é derivado do grupo quando existe lead. Atividade avulsa fica sem closer.
CREATE OR REPLACE FUNCTION public.arqo_definir_closer_agendamento()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_closer uuid;
  v_grupo uuid;
BEGIN
  -- Atividade sem lead: nada a derivar, mantém o closer informado (ou nulo).
  IF NEW.lead_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT lead.grupo_id, grupo.closer_id
  INTO v_grupo, v_closer
  FROM public.arqo_leads lead
  LEFT JOIN public.arqo_grupos_atendimento grupo ON grupo.id = lead.grupo_id
  WHERE lead.id = NEW.lead_id;

  IF v_grupo IS NULL THEN
    RAISE EXCEPTION 'O lead precisa estar vinculado a um grupo antes do agendamento';
  END IF;
  IF v_closer IS NULL THEN
    RAISE EXCEPTION 'O grupo do lead não possui closer configurado';
  END IF;

  NEW.closer_id := v_closer;
  RETURN NEW;
END;
$$;

-- 3) Prevenção de duplicidade só se aplica a atividades com lead.
CREATE OR REPLACE FUNCTION public.arqo_prevenir_agendamento_duplicado()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Sem lead não há chave de duplicidade (lead_id, tipo, data_hora).
  IF NEW.lead_id IS NULL THEN
    RETURN NEW;
  END IF;

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

-- 4) RLS: o responsável enxerga/gerencia a própria atividade mesmo sem lead.
--    Admin/gestor deixam de depender do lead para ver atividades avulsas.
DROP POLICY IF EXISTS arqo_agend_select ON public.arqo_agendamentos;
CREATE POLICY arqo_agend_select
  ON public.arqo_agendamentos
  FOR SELECT TO authenticated
  USING (
    responsavel_id = (select auth.uid())
    OR closer_id = (select auth.uid())
    OR public.is_admin((select auth.uid()))
    OR public.has_role((select auth.uid()), 'arqo_admin')
    OR public.has_role((select auth.uid()), 'arqo_gestor')
    OR EXISTS (
      SELECT 1
      FROM public.arqo_leads lead
      WHERE lead.id = lead_id
        AND (
          lead.consultor_id = (select auth.uid())
          OR lead.closer_id = (select auth.uid())
        )
    )
  );

DROP POLICY IF EXISTS arqo_agend_write ON public.arqo_agendamentos;
CREATE POLICY arqo_agend_write
  ON public.arqo_agendamentos
  FOR ALL TO authenticated
  USING (
    responsavel_id = (select auth.uid())
    OR closer_id = (select auth.uid())
    OR public.is_admin((select auth.uid()))
    OR public.has_role((select auth.uid()), 'arqo_admin')
    OR public.has_role((select auth.uid()), 'arqo_gestor')
    OR EXISTS (
      SELECT 1
      FROM public.arqo_leads lead
      WHERE lead.id = lead_id
        AND (
          lead.consultor_id = (select auth.uid())
          OR lead.closer_id = (select auth.uid())
        )
    )
  )
  -- WITH CHECK mais restrito que o USING: ser responsável só autoriza a
  -- atividade AVULSA (sem lead). Vincular a um lead continua exigindo ser
  -- consultor/closer do lead (ou admin/gestor), evitando que alguém se
  -- atribua a um lead alheio para ganhar acesso ao cliente vinculado.
  WITH CHECK (
    public.is_admin((select auth.uid()))
    OR public.has_role((select auth.uid()), 'arqo_admin')
    OR public.has_role((select auth.uid()), 'arqo_gestor')
    OR (lead_id IS NULL AND responsavel_id = (select auth.uid()))
    OR (
      lead_id IS NOT NULL
      AND (
        closer_id = (select auth.uid())
        OR EXISTS (
          SELECT 1
          FROM public.arqo_leads lead
          WHERE lead.id = lead_id
            AND (
              lead.consultor_id = (select auth.uid())
              OR lead.closer_id = (select auth.uid())
            )
        )
      )
    )
  );
