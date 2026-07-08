
-- ============ Config tables ============
CREATE TABLE public.arqo_lead_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL UNIQUE,
  descricao text,
  is_active boolean NOT NULL DEFAULT true,
  ordem int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.arqo_lead_sources TO authenticated;
GRANT ALL ON public.arqo_lead_sources TO service_role;
ALTER TABLE public.arqo_lead_sources ENABLE ROW LEVEL SECURITY;
CREATE POLICY arqo_lead_sources_select ON public.arqo_lead_sources FOR SELECT TO authenticated USING (true);
CREATE POLICY arqo_lead_sources_write ON public.arqo_lead_sources FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()) OR public.has_role(auth.uid(),'arqo_admin') OR public.has_role(auth.uid(),'arqo_gestor'))
  WITH CHECK (public.is_admin(auth.uid()) OR public.has_role(auth.uid(),'arqo_admin') OR public.has_role(auth.uid(),'arqo_gestor'));

CREATE TABLE public.arqo_temperaturas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL UNIQUE,
  peso numeric(5,2) NOT NULL DEFAULT 1.0,
  cor text NOT NULL DEFAULT '#65737e',
  ordem int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.arqo_temperaturas TO authenticated;
GRANT ALL ON public.arqo_temperaturas TO service_role;
ALTER TABLE public.arqo_temperaturas ENABLE ROW LEVEL SECURITY;
CREATE POLICY arqo_temperaturas_select ON public.arqo_temperaturas FOR SELECT TO authenticated USING (true);
CREATE POLICY arqo_temperaturas_write ON public.arqo_temperaturas FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()) OR public.has_role(auth.uid(),'arqo_admin'))
  WITH CHECK (public.is_admin(auth.uid()) OR public.has_role(auth.uid(),'arqo_admin'));

CREATE TABLE public.arqo_funil_etapas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL UNIQUE,
  descricao text,
  ordem int NOT NULL,
  peso numeric(5,2) NOT NULL DEFAULT 0.0,
  categoria text NOT NULL DEFAULT 'ativa' CHECK (categoria IN ('ativa','ganho','perda','descartado')),
  is_encerramento boolean NOT NULL DEFAULT false,
  cor text NOT NULL DEFAULT '#65737e',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.arqo_funil_etapas TO authenticated;
GRANT ALL ON public.arqo_funil_etapas TO service_role;
ALTER TABLE public.arqo_funil_etapas ENABLE ROW LEVEL SECURITY;
CREATE POLICY arqo_funil_etapas_select ON public.arqo_funil_etapas FOR SELECT TO authenticated USING (true);
CREATE POLICY arqo_funil_etapas_write ON public.arqo_funil_etapas FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()) OR public.has_role(auth.uid(),'arqo_admin'))
  WITH CHECK (public.is_admin(auth.uid()) OR public.has_role(auth.uid(),'arqo_admin'));

CREATE TABLE public.arqo_sla_regras (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  etapa_id uuid NOT NULL REFERENCES public.arqo_funil_etapas(id) ON DELETE CASCADE,
  temperatura_id uuid REFERENCES public.arqo_temperaturas(id) ON DELETE SET NULL,
  horas_max int NOT NULL DEFAULT 24,
  acao_expiracao text NOT NULL DEFAULT 'notificar' CHECK (acao_expiracao IN ('notificar','reatribuir','encerrar')),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(etapa_id, temperatura_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.arqo_sla_regras TO authenticated;
GRANT ALL ON public.arqo_sla_regras TO service_role;
ALTER TABLE public.arqo_sla_regras ENABLE ROW LEVEL SECURITY;
CREATE POLICY arqo_sla_regras_select ON public.arqo_sla_regras FOR SELECT TO authenticated USING (true);
CREATE POLICY arqo_sla_regras_write ON public.arqo_sla_regras FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()) OR public.has_role(auth.uid(),'arqo_admin'))
  WITH CHECK (public.is_admin(auth.uid()) OR public.has_role(auth.uid(),'arqo_admin'));

CREATE TABLE public.arqo_grupos_atendimento (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL UNIQUE,
  descricao text,
  tipo text NOT NULL DEFAULT 'consultor' CHECK (tipo IN ('consultor','closer','misto')),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.arqo_grupos_atendimento TO authenticated;
GRANT ALL ON public.arqo_grupos_atendimento TO service_role;
ALTER TABLE public.arqo_grupos_atendimento ENABLE ROW LEVEL SECURITY;
CREATE POLICY arqo_grupos_select ON public.arqo_grupos_atendimento FOR SELECT TO authenticated USING (true);
CREATE POLICY arqo_grupos_write ON public.arqo_grupos_atendimento FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()) OR public.has_role(auth.uid(),'arqo_admin') OR public.has_role(auth.uid(),'arqo_gestor'))
  WITH CHECK (public.is_admin(auth.uid()) OR public.has_role(auth.uid(),'arqo_admin') OR public.has_role(auth.uid(),'arqo_gestor'));

CREATE TABLE public.arqo_grupo_membros (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  grupo_id uuid NOT NULL REFERENCES public.arqo_grupos_atendimento(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  papel text NOT NULL DEFAULT 'consultor' CHECK (papel IN ('consultor','closer')),
  is_active boolean NOT NULL DEFAULT true,
  ordem_roleta int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(grupo_id, user_id, papel)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.arqo_grupo_membros TO authenticated;
GRANT ALL ON public.arqo_grupo_membros TO service_role;
ALTER TABLE public.arqo_grupo_membros ENABLE ROW LEVEL SECURITY;
CREATE POLICY arqo_grupo_membros_select ON public.arqo_grupo_membros FOR SELECT TO authenticated USING (true);
CREATE POLICY arqo_grupo_membros_write ON public.arqo_grupo_membros FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()) OR public.has_role(auth.uid(),'arqo_admin') OR public.has_role(auth.uid(),'arqo_gestor'))
  WITH CHECK (public.is_admin(auth.uid()) OR public.has_role(auth.uid(),'arqo_admin') OR public.has_role(auth.uid(),'arqo_gestor'));

CREATE TABLE public.arqo_regua_reengajamento (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  dias_apos_ultimo_contato int NOT NULL,
  canal text NOT NULL DEFAULT 'whatsapp' CHECK (canal IN ('whatsapp','email','sms','ligacao')),
  mensagem_template text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  ordem int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.arqo_regua_reengajamento TO authenticated;
GRANT ALL ON public.arqo_regua_reengajamento TO service_role;
ALTER TABLE public.arqo_regua_reengajamento ENABLE ROW LEVEL SECURITY;
CREATE POLICY arqo_regua_select ON public.arqo_regua_reengajamento FOR SELECT TO authenticated USING (true);
CREATE POLICY arqo_regua_write ON public.arqo_regua_reengajamento FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()) OR public.has_role(auth.uid(),'arqo_admin'))
  WITH CHECK (public.is_admin(auth.uid()) OR public.has_role(auth.uid(),'arqo_admin'));

-- ============ Leads ============
CREATE TABLE public.arqo_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid NOT NULL REFERENCES public.clientes(id) ON DELETE RESTRICT,
  source_id uuid REFERENCES public.arqo_lead_sources(id) ON DELETE SET NULL,
  etapa_id uuid NOT NULL REFERENCES public.arqo_funil_etapas(id) ON DELETE RESTRICT,
  temperatura_id uuid REFERENCES public.arqo_temperaturas(id) ON DELETE SET NULL,
  grupo_id uuid REFERENCES public.arqo_grupos_atendimento(id) ON DELETE SET NULL,
  consultor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  closer_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  empreendimento_id uuid REFERENCES public.empreendimentos(id) ON DELETE SET NULL,
  unidade_id uuid REFERENCES public.unidades(id) ON DELETE SET NULL,
  valor_estimado numeric(14,2),
  observacoes text,
  tentativas_contato int NOT NULL DEFAULT 0,
  ultimo_contato_em timestamptz,
  proximo_contato_em timestamptz,
  optout_em timestamptz,
  atendimento_final_pelo_gestor boolean NOT NULL DEFAULT false,
  qualificacao_score int,
  qualificacao_resumo text,
  qualificacao_atualizada_em timestamptz,
  motivo_perda text,
  fechado_em timestamptz,
  atribuido_em timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL
);
CREATE INDEX idx_arqo_leads_cliente ON public.arqo_leads(cliente_id);
CREATE INDEX idx_arqo_leads_etapa ON public.arqo_leads(etapa_id);
CREATE INDEX idx_arqo_leads_consultor ON public.arqo_leads(consultor_id);
CREATE INDEX idx_arqo_leads_closer ON public.arqo_leads(closer_id);
CREATE INDEX idx_arqo_leads_grupo ON public.arqo_leads(grupo_id);
CREATE INDEX idx_arqo_leads_optout ON public.arqo_leads(optout_em) WHERE optout_em IS NULL;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.arqo_leads TO authenticated;
GRANT ALL ON public.arqo_leads TO service_role;
ALTER TABLE public.arqo_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY arqo_leads_select ON public.arqo_leads FOR SELECT TO authenticated USING (
  public.is_admin(auth.uid())
  OR public.has_role(auth.uid(),'arqo_admin')
  OR public.has_role(auth.uid(),'arqo_gestor')
  OR consultor_id = auth.uid()
  OR closer_id = auth.uid()
);
CREATE POLICY arqo_leads_insert ON public.arqo_leads FOR INSERT TO authenticated WITH CHECK (
  public.is_admin(auth.uid())
  OR public.has_role(auth.uid(),'arqo_admin')
  OR public.has_role(auth.uid(),'arqo_gestor')
  OR public.has_role(auth.uid(),'arqo_consultor')
  OR public.has_role(auth.uid(),'arqo_closer')
);
CREATE POLICY arqo_leads_update ON public.arqo_leads FOR UPDATE TO authenticated USING (
  public.is_admin(auth.uid())
  OR public.has_role(auth.uid(),'arqo_admin')
  OR public.has_role(auth.uid(),'arqo_gestor')
  OR consultor_id = auth.uid()
  OR closer_id = auth.uid()
) WITH CHECK (
  public.is_admin(auth.uid())
  OR public.has_role(auth.uid(),'arqo_admin')
  OR public.has_role(auth.uid(),'arqo_gestor')
  OR consultor_id = auth.uid()
  OR closer_id = auth.uid()
);
CREATE POLICY arqo_leads_delete ON public.arqo_leads FOR DELETE TO authenticated USING (
  public.is_admin(auth.uid()) OR public.has_role(auth.uid(),'arqo_admin')
);

-- ============ Lead events (append-only) ============
CREATE TABLE public.arqo_lead_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.arqo_leads(id) ON DELETE CASCADE,
  tipo text NOT NULL,
  etapa_de uuid REFERENCES public.arqo_funil_etapas(id) ON DELETE SET NULL,
  etapa_para uuid REFERENCES public.arqo_funil_etapas(id) ON DELETE SET NULL,
  temperatura_de uuid REFERENCES public.arqo_temperaturas(id) ON DELETE SET NULL,
  temperatura_para uuid REFERENCES public.arqo_temperaturas(id) ON DELETE SET NULL,
  usuario_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  comentario text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_arqo_lead_events_lead ON public.arqo_lead_events(lead_id, created_at DESC);
GRANT SELECT, INSERT ON public.arqo_lead_events TO authenticated;
GRANT ALL ON public.arqo_lead_events TO service_role;
ALTER TABLE public.arqo_lead_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY arqo_lead_events_select ON public.arqo_lead_events FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.arqo_leads l WHERE l.id = lead_id AND (
    public.is_admin(auth.uid()) OR public.has_role(auth.uid(),'arqo_admin') OR public.has_role(auth.uid(),'arqo_gestor')
    OR l.consultor_id = auth.uid() OR l.closer_id = auth.uid()
  ))
);
CREATE POLICY arqo_lead_events_insert ON public.arqo_lead_events FOR INSERT TO authenticated WITH CHECK (true);

-- ============ Responsáveis ============
CREATE TABLE public.arqo_oportunidade_responsaveis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.arqo_leads(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  papel text NOT NULL CHECK (papel IN ('consultor','closer','gestor','apoio')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(lead_id, user_id, papel)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.arqo_oportunidade_responsaveis TO authenticated;
GRANT ALL ON public.arqo_oportunidade_responsaveis TO service_role;
ALTER TABLE public.arqo_oportunidade_responsaveis ENABLE ROW LEVEL SECURITY;
CREATE POLICY arqo_resp_select ON public.arqo_oportunidade_responsaveis FOR SELECT TO authenticated USING (true);
CREATE POLICY arqo_resp_write ON public.arqo_oportunidade_responsaveis FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()) OR public.has_role(auth.uid(),'arqo_admin') OR public.has_role(auth.uid(),'arqo_gestor'))
  WITH CHECK (public.is_admin(auth.uid()) OR public.has_role(auth.uid(),'arqo_admin') OR public.has_role(auth.uid(),'arqo_gestor'));

-- ============ Agendamentos ============
CREATE TABLE public.arqo_agendamentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.arqo_leads(id) ON DELETE CASCADE,
  tipo text NOT NULL CHECK (tipo IN ('visita','reuniao','ligacao','outro')),
  data_hora timestamptz NOT NULL,
  duracao_min int NOT NULL DEFAULT 30,
  local text,
  observacoes text,
  status text NOT NULL DEFAULT 'agendado' CHECK (status IN ('agendado','confirmado','realizado','cancelado','no_show')),
  google_event_id text,
  responsavel_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_arqo_agend_lead ON public.arqo_agendamentos(lead_id, data_hora);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.arqo_agendamentos TO authenticated;
GRANT ALL ON public.arqo_agendamentos TO service_role;
ALTER TABLE public.arqo_agendamentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY arqo_agend_select ON public.arqo_agendamentos FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.arqo_leads l WHERE l.id = lead_id AND (
    public.is_admin(auth.uid()) OR public.has_role(auth.uid(),'arqo_admin') OR public.has_role(auth.uid(),'arqo_gestor')
    OR l.consultor_id = auth.uid() OR l.closer_id = auth.uid()
  ))
);
CREATE POLICY arqo_agend_write ON public.arqo_agendamentos FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.arqo_leads l WHERE l.id = lead_id AND (
    public.is_admin(auth.uid()) OR public.has_role(auth.uid(),'arqo_admin') OR public.has_role(auth.uid(),'arqo_gestor')
    OR l.consultor_id = auth.uid() OR l.closer_id = auth.uid()
  )))
  WITH CHECK (EXISTS (SELECT 1 FROM public.arqo_leads l WHERE l.id = lead_id AND (
    public.is_admin(auth.uid()) OR public.has_role(auth.uid(),'arqo_admin') OR public.has_role(auth.uid(),'arqo_gestor')
    OR l.consultor_id = auth.uid() OR l.closer_id = auth.uid()
  )));

-- ============ Triggers de updated_at ============
CREATE TRIGGER trg_arqo_sources_upd BEFORE UPDATE ON public.arqo_lead_sources FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_arqo_temp_upd BEFORE UPDATE ON public.arqo_temperaturas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_arqo_etapas_upd BEFORE UPDATE ON public.arqo_funil_etapas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_arqo_sla_upd BEFORE UPDATE ON public.arqo_sla_regras FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_arqo_grupos_upd BEFORE UPDATE ON public.arqo_grupos_atendimento FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_arqo_regua_upd BEFORE UPDATE ON public.arqo_regua_reengajamento FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_arqo_leads_upd BEFORE UPDATE ON public.arqo_leads FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_arqo_agend_upd BEFORE UPDATE ON public.arqo_agendamentos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ Impede update/delete em eventos (append-only) ============
CREATE OR REPLACE FUNCTION public.arqo_lead_events_readonly()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  RAISE EXCEPTION 'Eventos de lead são imutáveis';
END;
$$;
CREATE TRIGGER trg_arqo_events_no_upd BEFORE UPDATE ON public.arqo_lead_events FOR EACH ROW EXECUTE FUNCTION public.arqo_lead_events_readonly();
CREATE TRIGGER trg_arqo_events_no_del BEFORE DELETE ON public.arqo_lead_events FOR EACH ROW EXECUTE FUNCTION public.arqo_lead_events_readonly();

-- ============ RPC: get_or_create_pessoa ============
CREATE OR REPLACE FUNCTION public.get_or_create_pessoa(
  p_nome text,
  p_cpf text DEFAULT NULL,
  p_telefone text DEFAULT NULL,
  p_email text DEFAULT NULL,
  p_origem text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_id uuid;
BEGIN
  IF p_cpf IS NOT NULL AND btrim(p_cpf) <> '' THEN
    SELECT id INTO v_id FROM public.clientes WHERE cpf = p_cpf LIMIT 1;
    IF v_id IS NOT NULL THEN RETURN v_id; END IF;
  END IF;
  IF p_telefone IS NOT NULL AND btrim(p_telefone) <> '' THEN
    SELECT id INTO v_id FROM public.clientes WHERE telefone = p_telefone OR whatsapp = p_telefone LIMIT 1;
    IF v_id IS NOT NULL THEN RETURN v_id; END IF;
  END IF;
  IF p_email IS NOT NULL AND btrim(p_email) <> '' THEN
    SELECT id INTO v_id FROM public.clientes WHERE lower(email) = lower(p_email) LIMIT 1;
    IF v_id IS NOT NULL THEN RETURN v_id; END IF;
  END IF;

  INSERT INTO public.clientes (nome, cpf, telefone, whatsapp, email, origem, nivel_cadastro)
  VALUES (COALESCE(NULLIF(btrim(p_nome),''),'LEAD SEM NOME'), NULLIF(btrim(p_cpf),''), NULLIF(btrim(p_telefone),''), NULLIF(btrim(p_telefone),''), NULLIF(btrim(p_email),''), p_origem, 'lead')
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

-- ============ RPC: transicionar_status ============
CREATE OR REPLACE FUNCTION public.arqo_transicionar_status(
  p_lead_id uuid,
  p_etapa_para uuid,
  p_comentario text DEFAULT NULL,
  p_motivo_perda text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_etapa_de uuid;
  v_is_encerramento boolean;
  v_categoria text;
BEGIN
  SELECT etapa_id INTO v_etapa_de FROM public.arqo_leads WHERE id = p_lead_id FOR UPDATE;
  IF v_etapa_de IS NULL THEN RAISE EXCEPTION 'Lead não encontrado'; END IF;
  SELECT is_encerramento, categoria INTO v_is_encerramento, v_categoria FROM public.arqo_funil_etapas WHERE id = p_etapa_para;
  IF v_categoria IS NULL THEN RAISE EXCEPTION 'Etapa destino inválida'; END IF;

  UPDATE public.arqo_leads SET
    etapa_id = p_etapa_para,
    motivo_perda = CASE WHEN v_categoria = 'perda' THEN COALESCE(p_motivo_perda, motivo_perda) ELSE motivo_perda END,
    fechado_em = CASE WHEN v_is_encerramento AND fechado_em IS NULL THEN now() ELSE fechado_em END,
    updated_at = now()
  WHERE id = p_lead_id;

  INSERT INTO public.arqo_lead_events (lead_id, tipo, etapa_de, etapa_para, usuario_id, comentario)
  VALUES (p_lead_id, 'transicao_etapa', v_etapa_de, p_etapa_para, auth.uid(), p_comentario);
END;
$$;

-- ============ RPC: atribuir_lead_roleta (1:1 bloqueante) ============
CREATE OR REPLACE FUNCTION public.arqo_atribuir_lead_roleta(
  p_grupo_id uuid,
  p_lead_id uuid,
  p_tipo_atribuicao text DEFAULT 'roleta'
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user uuid;
  v_ocupado uuid;
BEGIN
  -- Escolhe consultor ativo do grupo com menor carga (sem lead ativo)
  SELECT gm.user_id INTO v_user
  FROM public.arqo_grupo_membros gm
  WHERE gm.grupo_id = p_grupo_id
    AND gm.is_active = true
    AND gm.papel = 'consultor'
    AND NOT EXISTS (
      SELECT 1 FROM public.arqo_leads l
      WHERE l.consultor_id = gm.user_id
        AND l.is_active = true
        AND l.optout_em IS NULL
        AND l.fechado_em IS NULL
    )
  ORDER BY gm.ordem_roleta, gm.created_at
  LIMIT 1;

  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Nenhum consultor disponível no grupo agora (roleta bloqueada)';
  END IF;

  UPDATE public.arqo_leads
  SET consultor_id = v_user, grupo_id = p_grupo_id, atribuido_em = now(), updated_at = now()
  WHERE id = p_lead_id;

  INSERT INTO public.arqo_lead_events (lead_id, tipo, usuario_id, payload)
  VALUES (p_lead_id, 'atribuicao', v_user, jsonb_build_object('grupo_id', p_grupo_id, 'tipo_atribuicao', p_tipo_atribuicao));
  RETURN v_user;
END;
$$;

-- ============ RPC: registrar_tentativa_sem_resposta ============
CREATE OR REPLACE FUNCTION public.arqo_registrar_tentativa(
  p_lead_id uuid,
  p_canal text DEFAULT 'whatsapp',
  p_comentario text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.arqo_leads
  SET tentativas_contato = tentativas_contato + 1,
      ultimo_contato_em = now(),
      updated_at = now()
  WHERE id = p_lead_id;

  INSERT INTO public.arqo_lead_events (lead_id, tipo, usuario_id, payload, comentario)
  VALUES (p_lead_id, 'tentativa_sem_resposta', auth.uid(), jsonb_build_object('canal', p_canal), p_comentario);
END;
$$;

-- ============ RPC: liberar_consultor ============
CREATE OR REPLACE FUNCTION public.arqo_liberar_consultor(p_lead_id uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_consultor uuid;
BEGIN
  SELECT consultor_id INTO v_consultor FROM public.arqo_leads WHERE id = p_lead_id;
  UPDATE public.arqo_leads SET consultor_id = NULL, updated_at = now() WHERE id = p_lead_id;
  INSERT INTO public.arqo_lead_events (lead_id, tipo, usuario_id, payload)
  VALUES (p_lead_id, 'liberacao_consultor', auth.uid(), jsonb_build_object('consultor_anterior', v_consultor));
END;
$$;

-- ============ View forecast ponderado ============
CREATE OR REPLACE VIEW public.arqo_vw_forecast_ponderado AS
SELECT
  l.id AS lead_id,
  l.cliente_id,
  l.etapa_id,
  e.nome AS etapa_nome,
  e.categoria AS etapa_categoria,
  l.temperatura_id,
  t.nome AS temperatura_nome,
  l.empreendimento_id,
  l.consultor_id,
  l.closer_id,
  l.grupo_id,
  COALESCE(l.valor_estimado, u.valor, 0) AS valor_bruto,
  COALESCE(t.peso, 1.0) * COALESCE(e.peso, 0.0) AS fator_ponderacao,
  COALESCE(l.valor_estimado, u.valor, 0) * COALESCE(t.peso, 1.0) * COALESCE(e.peso, 0.0) AS valor_ponderado,
  l.created_at,
  l.updated_at
FROM public.arqo_leads l
LEFT JOIN public.arqo_funil_etapas e ON e.id = l.etapa_id
LEFT JOIN public.arqo_temperaturas t ON t.id = l.temperatura_id
LEFT JOIN public.unidades u ON u.id = l.unidade_id
WHERE l.is_active = true AND l.optout_em IS NULL AND e.categoria = 'ativa';

GRANT SELECT ON public.arqo_vw_forecast_ponderado TO authenticated;

-- ============ Seeds mínimos ============
INSERT INTO public.arqo_lead_sources (nome, ordem) VALUES
  ('Site',1),('Instagram',2),('Facebook',3),('WhatsApp',4),('Indicação',5),('Portal Imob.',6),('Outros',99)
ON CONFLICT DO NOTHING;

INSERT INTO public.arqo_temperaturas (nome, peso, cor, ordem) VALUES
  ('Frio',0.25,'#a7adba',1),('Morno',0.55,'#65737e',2),('Quente',0.85,'#4f5b66',3),('Cliente',1.00,'#343d46',4)
ON CONFLICT DO NOTHING;

INSERT INTO public.arqo_funil_etapas (nome, ordem, peso, categoria, cor) VALUES
  ('Novo lead',10,0.05,'ativa','#a7adba'),
  ('Em qualificação',20,0.15,'ativa','#c0c5ce'),
  ('Qualificado',30,0.30,'ativa','#65737e'),
  ('Reunião agendada',40,0.50,'ativa','#4f5b66'),
  ('Proposta',50,0.75,'ativa','#343d46'),
  ('Ganho',90,1.00,'ganho','#4a7c59'),
  ('Perdido',95,0.00,'perda','#8b3a3a'),
  ('Descartado',99,0.00,'descartado','#c0c5ce')
ON CONFLICT DO NOTHING;

UPDATE public.arqo_funil_etapas SET is_encerramento = true WHERE categoria IN ('ganho','perda','descartado');
