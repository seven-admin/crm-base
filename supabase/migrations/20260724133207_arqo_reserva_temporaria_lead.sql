-- Reserva temporariamente um lead sem resposta para o consultor que realizou
-- a tentativa. A reserva não bloqueia a roleta do consultor e, após expirar,
-- o lead volta a ficar elegível para qualquer consultor do grupo.

ALTER TABLE public.arqo_grupos_atendimento
  ADD COLUMN IF NOT EXISTS horas_reserva_sem_resposta integer NOT NULL DEFAULT 24;

ALTER TABLE public.arqo_grupos_atendimento
  DROP CONSTRAINT IF EXISTS arqo_grupos_horas_reserva_sem_resposta_check;

ALTER TABLE public.arqo_grupos_atendimento
  ADD CONSTRAINT arqo_grupos_horas_reserva_sem_resposta_check
  CHECK (horas_reserva_sem_resposta BETWEEN 0 AND 720);

COMMENT ON COLUMN public.arqo_grupos_atendimento.horas_reserva_sem_resposta IS
  'Horas em que um lead encerrado sem resposta fica reservado ao consultor anterior. Zero desativa a reserva.';

ALTER TABLE public.arqo_leads
  ADD COLUMN IF NOT EXISTS reserva_consultor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reserva_ate timestamptz;

COMMENT ON COLUMN public.arqo_leads.reserva_consultor_id IS
  'Consultor com preferência exclusiva para retomar o lead durante a reserva.';
COMMENT ON COLUMN public.arqo_leads.reserva_ate IS
  'Fim da reserva temporária; após este horário o lead volta à fila geral.';

DROP POLICY IF EXISTS arqo_leads_select ON public.arqo_leads;
CREATE POLICY arqo_leads_select
ON public.arqo_leads
FOR SELECT
TO authenticated
USING (
  public.is_admin((SELECT auth.uid()))
  OR public.has_role((SELECT auth.uid()), 'arqo_admin')
  OR public.has_role((SELECT auth.uid()), 'arqo_gestor')
  OR consultor_id = (SELECT auth.uid())
  OR reserva_consultor_id = (SELECT auth.uid())
  OR closer_id = (SELECT auth.uid())
);

CREATE INDEX IF NOT EXISTS idx_arqo_leads_fila_disponivel
  ON public.arqo_leads (grupo_id, reserva_ate, ultimo_contato_em, created_at, id)
  WHERE consultor_id IS NULL
    AND is_active = true
    AND optout_em IS NULL
    AND fechado_em IS NULL;

CREATE OR REPLACE FUNCTION public.arqo_proteger_horas_reserva_grupo()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF OLD.horas_reserva_sem_resposta IS DISTINCT FROM NEW.horas_reserva_sem_resposta
     AND NOT public.is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Apenas superadministradores podem alterar o período de reserva da fila';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.arqo_proteger_horas_reserva_grupo() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_arqo_grupos_proteger_horas_reserva ON public.arqo_grupos_atendimento;
CREATE TRIGGER trg_arqo_grupos_proteger_horas_reserva
BEFORE UPDATE OF horas_reserva_sem_resposta ON public.arqo_grupos_atendimento
FOR EACH ROW
EXECUTE FUNCTION public.arqo_proteger_horas_reserva_grupo();

CREATE OR REPLACE FUNCTION public.arqo_puxar_proximo_lead(p_grupo_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_lead uuid;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Usuário não autenticado'; END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.arqo_grupo_membros
    WHERE grupo_id = p_grupo_id AND user_id = v_user AND papel = 'consultor' AND is_active = true
  ) THEN RAISE EXCEPTION 'Usuário não pertence a este grupo como consultor'; END IF;

  IF EXISTS (
    SELECT 1
    FROM public.arqo_leads l
    JOIN public.arqo_funil_etapas e ON e.id = l.etapa_id
    WHERE l.consultor_id = v_user AND l.is_active = true AND l.optout_em IS NULL
      AND l.fechado_em IS NULL AND e.bloqueia_roleta = true
  ) THEN RAISE EXCEPTION 'Você já possui um lead ativo que bloqueia a roleta'; END IF;

  SELECT l.id INTO v_lead
  FROM public.arqo_leads l
  WHERE l.grupo_id = p_grupo_id
    AND l.consultor_id IS NULL
    AND (l.reserva_ate IS NULL OR l.reserva_ate <= now())
    AND l.is_active = true
    AND l.optout_em IS NULL
    AND l.fechado_em IS NULL
  ORDER BY l.ultimo_contato_em ASC NULLS FIRST, l.created_at ASC, l.id ASC
  FOR UPDATE SKIP LOCKED
  LIMIT 1;

  IF v_lead IS NULL THEN RAISE EXCEPTION 'Nenhum lead disponível neste grupo'; END IF;

  UPDATE public.arqo_leads
  SET consultor_id = v_user,
      atribuido_em = now(),
      reserva_consultor_id = NULL,
      reserva_ate = NULL,
      updated_at = now()
  WHERE id = v_lead;

  INSERT INTO public.arqo_lead_events (lead_id, tipo, usuario_id, payload)
  VALUES (v_lead, 'atribuicao', v_user, jsonb_build_object('grupo_id', p_grupo_id, 'tipo_atribuicao', 'pull_manual'));
  RETURN v_lead;
END;
$$;

REVOKE ALL ON FUNCTION public.arqo_puxar_proximo_lead(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.arqo_puxar_proximo_lead(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.arqo_contar_fila_usuario()
RETURNS TABLE(grupo_id uuid, quantidade bigint)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT gm.grupo_id, count(l.id)::bigint
  FROM public.arqo_grupo_membros gm
  LEFT JOIN public.arqo_leads l ON l.grupo_id = gm.grupo_id
    AND l.consultor_id IS NULL
    AND (l.reserva_ate IS NULL OR l.reserva_ate <= now())
    AND l.fechado_em IS NULL
    AND l.optout_em IS NULL
    AND l.is_active = true
  WHERE gm.user_id = auth.uid() AND gm.is_active = true AND gm.papel = 'consultor'
  GROUP BY gm.grupo_id;
$$;

REVOKE ALL ON FUNCTION public.arqo_contar_fila_usuario() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.arqo_contar_fila_usuario() TO authenticated;

CREATE OR REPLACE FUNCTION public.arqo_concluir_atendimento(
  p_lead_id uuid,
  p_status_codigo text,
  p_qualificacao_codigo text DEFAULT NULL,
  p_interesse_codigo text DEFAULT NULL,
  p_perfil_codigo text DEFAULT NULL,
  p_acao_codigo text DEFAULT NULL,
  p_acao_data timestamptz DEFAULT NULL,
  p_temperatura_id uuid DEFAULT NULL,
  p_observacao text DEFAULT NULL,
  p_acao_final text DEFAULT 'aplicar',
  p_etapa_destino_id uuid DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_atendimento_id uuid;
  v_atendeu boolean := p_status_codigo = 'C07';
  v_etapa_de uuid;
  v_closer uuid;
  v_grupo_id uuid;
  v_acao_sistema text;
  v_exige_data boolean := false;
  v_horas_reserva integer := 24;
  v_reserva_ate timestamptz;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Usuário não autenticado'; END IF;
  IF p_observacao IS NULL OR length(btrim(p_observacao)) = 0 THEN RAISE EXCEPTION 'Observação obrigatória'; END IF;
  IF p_acao_final NOT IN ('aplicar','mover_etapa','liberar','sem_resposta') THEN RAISE EXCEPTION 'Ação final inválida'; END IF;

  SELECT lead.etapa_id, lead.closer_id, lead.grupo_id,
         COALESCE(grupo.horas_reserva_sem_resposta, 24)
  INTO v_etapa_de, v_closer, v_grupo_id, v_horas_reserva
  FROM public.arqo_leads lead
  LEFT JOIN public.arqo_grupos_atendimento grupo ON grupo.id = lead.grupo_id
  WHERE lead.id = p_lead_id AND (
    lead.consultor_id = v_user OR public.is_admin(v_user)
    OR public.has_role(v_user,'arqo_admin') OR public.has_role(v_user,'arqo_gestor')
  )
  FOR UPDATE OF lead;
  IF v_etapa_de IS NULL THEN RAISE EXCEPTION 'Lead não encontrado ou sem permissão'; END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.arqo_atendimento_opcoes
    WHERE codigo = p_status_codigo AND grupo = 'status_ligacao' AND is_active
  ) THEN RAISE EXCEPTION 'Status de ligação inválido'; END IF;

  IF v_atendeu AND (
    p_qualificacao_codigo IS NULL OR p_interesse_codigo IS NULL OR p_perfil_codigo IS NULL
    OR p_acao_codigo IS NULL OR p_temperatura_id IS NULL
  ) THEN RAISE EXCEPTION 'Preencha todas as etapas do atendimento'; END IF;
  IF NOT v_atendeu AND p_acao_final <> 'sem_resposta' THEN
    RAISE EXCEPTION 'Atendimento sem contato deve ser concluído como sem resposta';
  END IF;
  IF p_acao_final = 'mover_etapa' AND p_etapa_destino_id IS NULL THEN
    RAISE EXCEPTION 'Etapa de destino obrigatória';
  END IF;

  IF p_acao_codigo IS NOT NULL THEN
    SELECT acao_sistema, exige_data INTO v_acao_sistema, v_exige_data
    FROM public.arqo_atendimento_opcoes
    WHERE codigo = p_acao_codigo AND grupo = 'proxima_acao' AND is_active;
    IF NOT FOUND THEN RAISE EXCEPTION 'Próxima ação inválida'; END IF;
    IF v_exige_data AND p_acao_data IS NULL THEN RAISE EXCEPTION 'Informe a data e hora do agendamento'; END IF;
    IF v_exige_data AND p_acao_data <= now() THEN RAISE EXCEPTION 'A data e hora do agendamento devem ser futuras'; END IF;
  END IF;

  IF p_acao_final = 'sem_resposta' AND v_horas_reserva > 0 THEN
    v_reserva_ate := now() + make_interval(hours => v_horas_reserva);
  END IF;

  INSERT INTO public.arqo_atendimentos (
    lead_id, consultor_id, status_codigo, qualificacao_codigo, interesse_codigo,
    perfil_codigo, acao_codigo, acao_data, temperatura_id, observacao,
    acao_final, etapa_destino_id
  ) VALUES (
    p_lead_id, v_user, p_status_codigo, p_qualificacao_codigo, p_interesse_codigo,
    p_perfil_codigo, p_acao_codigo, CASE WHEN v_exige_data THEN p_acao_data ELSE NULL END,
    p_temperatura_id, btrim(p_observacao), p_acao_final, p_etapa_destino_id
  ) RETURNING id INTO v_atendimento_id;

  UPDATE public.arqo_leads SET
    temperatura_id = COALESCE(p_temperatura_id, temperatura_id),
    ultimo_contato_em = now(),
    proximo_contato_em = CASE WHEN v_exige_data THEN p_acao_data ELSE proximo_contato_em END,
    tentativas_contato = tentativas_contato + CASE WHEN NOT v_atendeu THEN 1 ELSE 0 END,
    etapa_id = CASE WHEN p_acao_final = 'mover_etapa' THEN p_etapa_destino_id ELSE etapa_id END,
    consultor_id = CASE WHEN p_acao_final IN ('liberar', 'sem_resposta') THEN NULL ELSE consultor_id END,
    atribuido_em = CASE WHEN p_acao_final IN ('liberar', 'sem_resposta') THEN NULL ELSE atribuido_em END,
    reserva_consultor_id = CASE WHEN v_reserva_ate IS NOT NULL THEN v_user ELSE NULL END,
    reserva_ate = v_reserva_ate,
    updated_at = now()
  WHERE id = p_lead_id;

  IF v_acao_sistema = 'agendar_visita' THEN
    INSERT INTO public.arqo_agendamentos (lead_id, tipo, data_hora, responsavel_id, observacoes)
    VALUES (p_lead_id, 'visita', p_acao_data, v_user, p_observacao);
  ELSIF v_acao_sistema = 'agendar_retorno' THEN
    INSERT INTO public.arqo_agendamentos (lead_id, tipo, data_hora, responsavel_id, observacoes)
    VALUES (p_lead_id, 'ligacao', p_acao_data, v_user, p_observacao);
  END IF;

  INSERT INTO public.arqo_lead_events
    (lead_id, tipo, etapa_de, etapa_para, temperatura_para, usuario_id, payload, comentario)
  VALUES (
    p_lead_id, 'atendimento_registrado', v_etapa_de,
    CASE WHEN p_acao_final = 'mover_etapa' THEN p_etapa_destino_id ELSE NULL END,
    p_temperatura_id, v_user,
    jsonb_build_object(
      'atendimento_id', v_atendimento_id,
      'status_codigo', p_status_codigo,
      'qualificacao_codigo', p_qualificacao_codigo,
      'interesse_codigo', p_interesse_codigo,
      'perfil_codigo', p_perfil_codigo,
      'acao_codigo', p_acao_codigo,
      'acao_data', CASE WHEN v_exige_data THEN p_acao_data ELSE NULL END,
      'acao_final', p_acao_final,
      'closer_id', v_closer,
      'grupo_id', v_grupo_id,
      'reserva_ate', v_reserva_ate
    ),
    btrim(p_observacao)
  );
  RETURN v_atendimento_id;
END;
$$;

REVOKE ALL ON FUNCTION public.arqo_concluir_atendimento(uuid,text,text,text,text,text,timestamptz,uuid,text,text,uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.arqo_concluir_atendimento(uuid,text,text,text,text,text,timestamptz,uuid,text,text,uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.arqo_reabrir_atendimento_historico(
  p_atendimento_id uuid
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_lead_id uuid;
  v_grupo_id uuid;
  v_consultor_atual uuid;
  v_reserva_consultor_id uuid;
  v_reserva_ate timestamptz;
  v_is_active boolean;
  v_optout_em timestamptz;
  v_fechado_em timestamptz;
  v_etapa_encerramento boolean;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Usuário não autenticado'; END IF;

  SELECT atendimento.lead_id INTO v_lead_id
  FROM public.arqo_atendimentos atendimento
  WHERE atendimento.id = p_atendimento_id AND (
    atendimento.consultor_id = v_user OR public.is_admin(v_user)
    OR public.has_role(v_user, 'arqo_admin') OR public.has_role(v_user, 'arqo_gestor')
  );
  IF v_lead_id IS NULL THEN RAISE EXCEPTION 'Contato não encontrado ou sem permissão'; END IF;

  SELECT lead.grupo_id, lead.consultor_id, lead.reserva_consultor_id, lead.reserva_ate,
         lead.is_active, lead.optout_em, lead.fechado_em, etapa.is_encerramento
  INTO v_grupo_id, v_consultor_atual, v_reserva_consultor_id, v_reserva_ate,
       v_is_active, v_optout_em, v_fechado_em, v_etapa_encerramento
  FROM public.arqo_leads lead
  JOIN public.arqo_funil_etapas etapa ON etapa.id = lead.etapa_id
  WHERE lead.id = v_lead_id
  FOR UPDATE OF lead;

  IF NOT FOUND THEN RAISE EXCEPTION 'O lead deste contato não existe mais'; END IF;
  IF NOT v_is_active OR v_optout_em IS NOT NULL THEN RAISE EXCEPTION 'Este lead está inativo ou não permite novos contatos'; END IF;
  IF v_fechado_em IS NOT NULL OR v_etapa_encerramento THEN RAISE EXCEPTION 'Este lead já está encerrado'; END IF;

  IF NOT (
    public.is_admin(v_user) OR public.has_role(v_user, 'arqo_admin') OR public.has_role(v_user, 'arqo_gestor')
  ) AND NOT EXISTS (
    SELECT 1 FROM public.arqo_grupo_membros membro
    WHERE membro.grupo_id = v_grupo_id AND membro.user_id = v_user
      AND membro.papel = 'consultor' AND membro.is_active = true
  ) THEN RAISE EXCEPTION 'Você não pertence mais ao grupo deste lead'; END IF;

  IF v_consultor_atual IS NOT NULL AND v_consultor_atual <> v_user THEN
    RAISE EXCEPTION 'Este lead já está em atendimento por outro consultor';
  END IF;
  IF v_consultor_atual IS NULL
     AND v_reserva_ate > now()
     AND v_reserva_consultor_id <> v_user
     AND NOT public.is_admin(v_user) THEN
    RAISE EXCEPTION 'Este lead está temporariamente reservado para o consultor responsável pelo último contato';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.arqo_leads lead
    JOIN public.arqo_funil_etapas etapa ON etapa.id = lead.etapa_id
    WHERE lead.consultor_id = v_user AND lead.id <> v_lead_id
      AND lead.is_active = true AND lead.optout_em IS NULL AND lead.fechado_em IS NULL
      AND etapa.bloqueia_roleta = true
  ) THEN RAISE EXCEPTION 'Conclua o atendimento em andamento antes de iniciar outro'; END IF;

  IF v_consultor_atual IS NULL THEN
    UPDATE public.arqo_leads
    SET consultor_id = v_user,
        atribuido_em = now(),
        reserva_consultor_id = NULL,
        reserva_ate = NULL,
        updated_at = now()
    WHERE id = v_lead_id;

    INSERT INTO public.arqo_lead_events (lead_id, tipo, usuario_id, payload)
    VALUES (
      v_lead_id,
      'reatribuicao_historico',
      v_user,
      jsonb_build_object('atendimento_origem_id', p_atendimento_id)
    );
  END IF;

  RETURN v_lead_id;
END;
$$;

REVOKE ALL ON FUNCTION public.arqo_reabrir_atendimento_historico(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.arqo_reabrir_atendimento_historico(uuid) TO authenticated;
