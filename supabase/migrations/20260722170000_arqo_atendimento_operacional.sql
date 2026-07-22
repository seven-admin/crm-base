-- Atendimento operacional Arqo: roteiro configuravel, metas, historico e roleta atomica.

ALTER TABLE public.arqo_leads
  ADD COLUMN IF NOT EXISTS indicado_por_lead_id uuid REFERENCES public.arqo_leads(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_arqo_leads_indicado_por
  ON public.arqo_leads(indicado_por_lead_id)
  WHERE indicado_por_lead_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.arqo_atendimento_opcoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  grupo text NOT NULL CHECK (grupo IN ('status_ligacao','qualificacao','interesse','perfil','proxima_acao')),
  codigo text NOT NULL UNIQUE CHECK (codigo ~ '^[CQIPA][0-9]{2}$'),
  rotulo text NOT NULL,
  ordem integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  encerra_atendimento boolean NOT NULL DEFAULT false,
  libera_proximo_bloco boolean NOT NULL DEFAULT true,
  exige_data boolean NOT NULL DEFAULT false,
  acao_sistema text CHECK (acao_sistema IS NULL OR acao_sistema IN ('sem_resposta','atendido','encerrar','agendar_visita','agendar_retorno','enviar_whatsapp','acionar_gestor','acionar_closer')),
  temperatura_sugerida_id uuid REFERENCES public.arqo_temperaturas(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_arqo_atendimento_opcoes_grupo
  ON public.arqo_atendimento_opcoes(grupo, ordem)
  WHERE is_active = true;

CREATE TABLE IF NOT EXISTS public.arqo_atendimentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.arqo_leads(id) ON DELETE CASCADE,
  consultor_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  status_codigo text NOT NULL,
  qualificacao_codigo text,
  interesse_codigo text,
  perfil_codigo text,
  acao_codigo text,
  acao_data timestamptz,
  temperatura_id uuid REFERENCES public.arqo_temperaturas(id) ON DELETE SET NULL,
  observacao text NOT NULL CHECK (length(btrim(observacao)) > 0),
  acao_final text NOT NULL CHECK (acao_final IN ('aplicar','mover_etapa','liberar','sem_resposta')),
  etapa_destino_id uuid REFERENCES public.arqo_funil_etapas(id) ON DELETE SET NULL,
  indicado_lead_id uuid REFERENCES public.arqo_leads(id) ON DELETE SET NULL,
  encerrado_em timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_arqo_atendimentos_consultor_data
  ON public.arqo_atendimentos(consultor_id, encerrado_em DESC);
CREATE INDEX IF NOT EXISTS idx_arqo_atendimentos_lead_data
  ON public.arqo_atendimentos(lead_id, encerrado_em DESC);

CREATE TABLE IF NOT EXISTS public.arqo_metas_atendimento (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  grupo_id uuid REFERENCES public.arqo_grupos_atendimento(id) ON DELETE CASCADE,
  vigencia_inicio date NOT NULL DEFAULT CURRENT_DATE,
  vigencia_fim date,
  meta_diaria_atendimentos integer NOT NULL DEFAULT 0 CHECK (meta_diaria_atendimentos >= 0),
  meta_diaria_retornos integer NOT NULL DEFAULT 0 CHECK (meta_diaria_retornos >= 0),
  meta_diaria_visitas integer NOT NULL DEFAULT 0 CHECK (meta_diaria_visitas >= 0),
  meta_diaria_conversoes integer NOT NULL DEFAULT 0 CHECK (meta_diaria_conversoes >= 0),
  meta_semanal_atendimentos integer NOT NULL DEFAULT 0 CHECK (meta_semanal_atendimentos >= 0),
  meta_semanal_retornos integer NOT NULL DEFAULT 0 CHECK (meta_semanal_retornos >= 0),
  meta_semanal_visitas integer NOT NULL DEFAULT 0 CHECK (meta_semanal_visitas >= 0),
  meta_semanal_conversoes integer NOT NULL DEFAULT 0 CHECK (meta_semanal_conversoes >= 0),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (vigencia_fim IS NULL OR vigencia_fim >= vigencia_inicio),
  CHECK (user_id IS NOT NULL OR grupo_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_arqo_metas_atendimento_vigencia
  ON public.arqo_metas_atendimento(user_id, grupo_id, vigencia_inicio DESC)
  WHERE is_active = true;

CREATE TABLE IF NOT EXISTS public.arqo_performance_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  limite_bom numeric(6,2) NOT NULL DEFAULT 100 CHECK (limite_bom >= 0),
  limite_atencao numeric(6,2) NOT NULL DEFAULT 70 CHECK (limite_atencao >= 0),
  peso_atendimentos numeric(6,2) NOT NULL DEFAULT 1 CHECK (peso_atendimentos >= 0),
  peso_retornos numeric(6,2) NOT NULL DEFAULT 1 CHECK (peso_retornos >= 0),
  peso_visitas numeric(6,2) NOT NULL DEFAULT 1 CHECK (peso_visitas >= 0),
  peso_conversoes numeric(6,2) NOT NULL DEFAULT 1 CHECK (peso_conversoes >= 0),
  is_default boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (limite_bom >= limite_atencao)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_arqo_performance_config_default
  ON public.arqo_performance_config(is_default)
  WHERE is_default = true AND is_active = true;

ALTER TABLE public.arqo_atendimento_opcoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.arqo_atendimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.arqo_metas_atendimento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.arqo_performance_config ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.arqo_atendimento_opcoes TO authenticated;
GRANT SELECT, INSERT ON public.arqo_atendimentos TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.arqo_metas_atendimento TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.arqo_performance_config TO authenticated;
GRANT ALL ON public.arqo_atendimento_opcoes, public.arqo_atendimentos, public.arqo_metas_atendimento, public.arqo_performance_config TO service_role;

DROP POLICY IF EXISTS arqo_atendimento_opcoes_select ON public.arqo_atendimento_opcoes;
CREATE POLICY arqo_atendimento_opcoes_select ON public.arqo_atendimento_opcoes
  FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS arqo_atendimento_opcoes_write ON public.arqo_atendimento_opcoes;
CREATE POLICY arqo_atendimento_opcoes_write ON public.arqo_atendimento_opcoes
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()) OR public.has_role(auth.uid(),'arqo_admin'))
  WITH CHECK (public.is_admin(auth.uid()) OR public.has_role(auth.uid(),'arqo_admin'));

DROP POLICY IF EXISTS arqo_atendimentos_select ON public.arqo_atendimentos;
CREATE POLICY arqo_atendimentos_select ON public.arqo_atendimentos
  FOR SELECT TO authenticated USING (
    consultor_id = auth.uid()
    OR public.is_admin(auth.uid())
    OR public.has_role(auth.uid(),'arqo_admin')
    OR public.has_role(auth.uid(),'arqo_gestor')
  );
DROP POLICY IF EXISTS arqo_atendimentos_insert ON public.arqo_atendimentos;
CREATE POLICY arqo_atendimentos_insert ON public.arqo_atendimentos
  FOR INSERT TO authenticated WITH CHECK (consultor_id = auth.uid());

DROP POLICY IF EXISTS arqo_metas_atendimento_select ON public.arqo_metas_atendimento;
CREATE POLICY arqo_metas_atendimento_select ON public.arqo_metas_atendimento
  FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS arqo_metas_atendimento_write ON public.arqo_metas_atendimento;
CREATE POLICY arqo_metas_atendimento_write ON public.arqo_metas_atendimento
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()) OR public.has_role(auth.uid(),'arqo_admin') OR public.has_role(auth.uid(),'arqo_gestor'))
  WITH CHECK (public.is_admin(auth.uid()) OR public.has_role(auth.uid(),'arqo_admin') OR public.has_role(auth.uid(),'arqo_gestor'));

DROP POLICY IF EXISTS arqo_performance_config_select ON public.arqo_performance_config;
CREATE POLICY arqo_performance_config_select ON public.arqo_performance_config
  FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS arqo_performance_config_write ON public.arqo_performance_config;
CREATE POLICY arqo_performance_config_write ON public.arqo_performance_config
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()) OR public.has_role(auth.uid(),'arqo_admin'))
  WITH CHECK (public.is_admin(auth.uid()) OR public.has_role(auth.uid(),'arqo_admin'));

DROP TRIGGER IF EXISTS trg_arqo_atendimento_opcoes_upd ON public.arqo_atendimento_opcoes;
CREATE TRIGGER trg_arqo_atendimento_opcoes_upd
  BEFORE UPDATE ON public.arqo_atendimento_opcoes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS trg_arqo_metas_atendimento_upd ON public.arqo_metas_atendimento;
CREATE TRIGGER trg_arqo_metas_atendimento_upd
  BEFORE UPDATE ON public.arqo_metas_atendimento
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS trg_arqo_performance_config_upd ON public.arqo_performance_config;
CREATE TRIGGER trg_arqo_performance_config_upd
  BEFORE UPDATE ON public.arqo_performance_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.arqo_temperaturas (nome, peso, cor, ordem, is_active)
VALUES ('Morto', 0, '#69615a', 99, true)
ON CONFLICT (nome) DO UPDATE SET is_active = true;

INSERT INTO public.arqo_atendimento_opcoes
  (grupo, codigo, rotulo, ordem, encerra_atendimento, libera_proximo_bloco, exige_data, acao_sistema, temperatura_sugerida_id)
VALUES
  ('status_ligacao','C01','Não atendeu',1,true,false,false,'sem_resposta',null),
  ('status_ligacao','C02','Número incorreto',2,true,false,false,'sem_resposta',null),
  ('status_ligacao','C03','Número inexistente',3,true,false,false,'sem_resposta',null),
  ('status_ligacao','C04','Retornar',4,true,false,false,'sem_resposta',null),
  ('status_ligacao','C05','Ocupado',5,true,false,false,'sem_resposta',null),
  ('status_ligacao','C06','Ligação caiu e não atende',6,true,false,false,'sem_resposta',null),
  ('status_ligacao','C07','Atendeu',7,false,true,false,'atendido',null),
  ('qualificacao','Q01','Não quis conversar no momento',1,false,true,false,null,null),
  ('qualificacao','Q02','Sem tempo',2,false,true,false,null,null),
  ('qualificacao','Q03','Pediu retorno',3,false,true,false,null,null),
  ('qualificacao','Q04','Conversa parcial',4,false,true,false,null,null),
  ('qualificacao','Q05','Conversa completa',5,false,true,false,null,null),
  ('qualificacao','Q06','Pediu para não ligar',6,false,true,false,null,null),
  ('interesse','I01','Sem interesse',1,false,true,false,null,(SELECT id FROM public.arqo_temperaturas WHERE nome='Frio' LIMIT 1)),
  ('interesse','I02','Curioso',2,false,true,false,null,(SELECT id FROM public.arqo_temperaturas WHERE nome='Frio' LIMIT 1)),
  ('interesse','I03','Interesse moderado',3,false,true,false,null,(SELECT id FROM public.arqo_temperaturas WHERE nome='Morno' LIMIT 1)),
  ('interesse','I04','Muito interessado',4,false,true,false,null,(SELECT id FROM public.arqo_temperaturas WHERE nome='Quente' LIMIT 1)),
  ('perfil','P01','Primeiro imóvel',1,false,true,false,null,null),
  ('perfil','P02','Investidor',2,false,true,false,null,null),
  ('perfil','P03','Troca de imóvel',3,false,true,false,null,null),
  ('perfil','P04','Moradia própria',4,false,true,false,null,null),
  ('perfil','P05','Alto padrão',5,false,true,false,null,null),
  ('perfil','P06','Evolução patrimonial',6,false,true,false,null,null),
  ('perfil','P07','Não identificado',7,false,true,false,null,null),
  ('proxima_acao','A01','Agendou visita',1,false,true,true,'agendar_visita',null),
  ('proxima_acao','A02','Agendou retorno para ligação',2,false,true,true,'agendar_retorno',null),
  ('proxima_acao','A03','Enviar WhatsApp',3,false,true,true,'enviar_whatsapp',null),
  ('proxima_acao','A04','Gestor de atendimento entrar em contato',4,false,true,true,'acionar_gestor',null),
  ('proxima_acao','A05','Especialista de produto entrar em contato',5,false,true,true,'acionar_closer',null),
  ('proxima_acao','A06','Encerrado',6,false,true,true,'encerrar',null)
ON CONFLICT (codigo) DO UPDATE SET
  grupo = EXCLUDED.grupo,
  rotulo = EXCLUDED.rotulo,
  ordem = EXCLUDED.ordem,
  encerra_atendimento = EXCLUDED.encerra_atendimento,
  libera_proximo_bloco = EXCLUDED.libera_proximo_bloco,
  exige_data = EXCLUDED.exige_data,
  acao_sistema = EXCLUDED.acao_sistema,
  temperatura_sugerida_id = EXCLUDED.temperatura_sugerida_id;

INSERT INTO public.arqo_performance_config
  (nome, limite_bom, limite_atencao, peso_atendimentos, peso_retornos, peso_visitas, peso_conversoes, is_default, is_active)
SELECT 'Padrão Arqo', 100, 70, 1, 1, 1, 1, true, true
WHERE NOT EXISTS (SELECT 1 FROM public.arqo_performance_config WHERE is_default = true AND is_active = true);

-- A RPC legada arqo_atribuir_lead_roleta é usada por integrações existentes e
-- pode ter evolução independente. A nova experiência usa a RPC abaixo, sem
-- substituir o contrato já publicado no banco.
CREATE OR REPLACE FUNCTION public.arqo_puxar_proximo_lead(p_grupo_id uuid)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
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
  WHERE l.grupo_id = p_grupo_id AND l.consultor_id IS NULL
    AND l.is_active = true AND l.optout_em IS NULL AND l.fechado_em IS NULL
  ORDER BY l.created_at ASC, l.id ASC
  FOR UPDATE SKIP LOCKED
  LIMIT 1;

  IF v_lead IS NULL THEN RAISE EXCEPTION 'Nenhum lead disponível neste grupo'; END IF;

  UPDATE public.arqo_leads
  SET consultor_id = v_user, atribuido_em = now(), updated_at = now()
  WHERE id = v_lead;

  INSERT INTO public.arqo_lead_events (lead_id, tipo, usuario_id, payload)
  VALUES (v_lead, 'atribuicao', v_user, jsonb_build_object('grupo_id', p_grupo_id, 'tipo_atribuicao', 'pull_manual'));
  RETURN v_lead;
END;
$$;

CREATE OR REPLACE FUNCTION public.arqo_contar_fila_usuario()
RETURNS TABLE(grupo_id uuid, quantidade bigint)
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT gm.grupo_id, count(l.id)::bigint
  FROM public.arqo_grupo_membros gm
  LEFT JOIN public.arqo_leads l ON l.grupo_id = gm.grupo_id
    AND l.consultor_id IS NULL AND l.fechado_em IS NULL AND l.optout_em IS NULL AND l.is_active = true
  WHERE gm.user_id = auth.uid() AND gm.is_active = true AND gm.papel = 'consultor'
  GROUP BY gm.grupo_id;
$$;

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
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user uuid := auth.uid();
  v_atendimento_id uuid;
  v_atendeu boolean := p_status_codigo = 'C07';
  v_etapa_de uuid;
  v_closer uuid;
  v_acao_sistema text;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Usuário não autenticado'; END IF;
  IF p_observacao IS NULL OR length(btrim(p_observacao)) = 0 THEN RAISE EXCEPTION 'Observação obrigatória'; END IF;
  IF p_acao_final NOT IN ('aplicar','mover_etapa','liberar','sem_resposta') THEN RAISE EXCEPTION 'Ação final inválida'; END IF;

  SELECT etapa_id, closer_id INTO v_etapa_de, v_closer
  FROM public.arqo_leads
  WHERE id = p_lead_id AND (
    consultor_id = v_user OR public.is_admin(v_user) OR public.has_role(v_user,'arqo_admin') OR public.has_role(v_user,'arqo_gestor')
  )
  FOR UPDATE;
  IF v_etapa_de IS NULL THEN RAISE EXCEPTION 'Lead não encontrado ou sem permissão'; END IF;

  IF NOT EXISTS (SELECT 1 FROM public.arqo_atendimento_opcoes WHERE codigo = p_status_codigo AND grupo = 'status_ligacao' AND is_active) THEN
    RAISE EXCEPTION 'Status de ligação inválido';
  END IF;

  IF v_atendeu AND (p_qualificacao_codigo IS NULL OR p_interesse_codigo IS NULL OR p_perfil_codigo IS NULL OR p_acao_codigo IS NULL OR p_acao_data IS NULL OR p_temperatura_id IS NULL) THEN
    RAISE EXCEPTION 'Preencha todas as etapas do atendimento';
  END IF;
  IF NOT v_atendeu AND p_acao_final <> 'sem_resposta' THEN
    RAISE EXCEPTION 'Atendimento sem contato deve ser concluído como sem resposta';
  END IF;
  IF p_acao_final = 'mover_etapa' AND p_etapa_destino_id IS NULL THEN RAISE EXCEPTION 'Etapa de destino obrigatória'; END IF;

  IF p_acao_codigo IS NOT NULL THEN
    SELECT acao_sistema INTO v_acao_sistema
    FROM public.arqo_atendimento_opcoes
    WHERE codigo = p_acao_codigo AND grupo = 'proxima_acao' AND is_active;
    IF NOT FOUND THEN RAISE EXCEPTION 'Próxima ação inválida'; END IF;
  END IF;

  INSERT INTO public.arqo_atendimentos (
    lead_id, consultor_id, status_codigo, qualificacao_codigo, interesse_codigo,
    perfil_codigo, acao_codigo, acao_data, temperatura_id, observacao,
    acao_final, etapa_destino_id
  ) VALUES (
    p_lead_id, v_user, p_status_codigo, p_qualificacao_codigo, p_interesse_codigo,
    p_perfil_codigo, p_acao_codigo, p_acao_data, p_temperatura_id, btrim(p_observacao),
    p_acao_final, p_etapa_destino_id
  ) RETURNING id INTO v_atendimento_id;

  UPDATE public.arqo_leads SET
    temperatura_id = COALESCE(p_temperatura_id, temperatura_id),
    ultimo_contato_em = now(),
    proximo_contato_em = CASE WHEN p_acao_codigo IS NOT NULL AND p_acao_codigo <> 'A06' THEN p_acao_data ELSE proximo_contato_em END,
    tentativas_contato = tentativas_contato + CASE WHEN NOT v_atendeu THEN 1 ELSE 0 END,
    etapa_id = CASE WHEN p_acao_final = 'mover_etapa' THEN p_etapa_destino_id ELSE etapa_id END,
    consultor_id = CASE WHEN p_acao_final = 'liberar' THEN NULL ELSE consultor_id END,
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
      'acao_data', p_acao_data,
      'acao_final', p_acao_final,
      'closer_id', v_closer
    ),
    btrim(p_observacao)
  );
  RETURN v_atendimento_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.arqo_criar_lead_indicado(
  p_lead_origem_id uuid,
  p_nome text,
  p_telefone text DEFAULT NULL,
  p_email text DEFAULT NULL,
  p_empreendimento_id uuid DEFAULT NULL,
  p_observacoes text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user uuid := auth.uid();
  v_cliente uuid;
  v_lead uuid;
  v_etapa uuid;
  v_source uuid;
  v_grupo uuid;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Usuário não autenticado'; END IF;
  IF p_nome IS NULL OR length(btrim(p_nome)) = 0 THEN RAISE EXCEPTION 'Nome obrigatório'; END IF;
  IF COALESCE(btrim(p_telefone),'') = '' AND COALESCE(btrim(p_email),'') = '' THEN RAISE EXCEPTION 'Informe telefone ou e-mail'; END IF;

  SELECT grupo_id INTO v_grupo FROM public.arqo_leads
  WHERE id = p_lead_origem_id AND (consultor_id = v_user OR closer_id = v_user OR public.is_admin(v_user) OR public.has_role(v_user,'arqo_admin') OR public.has_role(v_user,'arqo_gestor'));
  IF NOT FOUND THEN RAISE EXCEPTION 'Lead de origem não encontrado ou sem permissão'; END IF;

  v_cliente := public.get_or_create_pessoa(p_nome, NULL, p_telefone, p_email, 'Indicação');
  SELECT id INTO v_etapa FROM public.arqo_funil_etapas WHERE categoria = 'ativa' AND is_active ORDER BY ordem LIMIT 1;
  SELECT id INTO v_source FROM public.arqo_lead_sources WHERE lower(nome) = lower('Indicação') LIMIT 1;

  INSERT INTO public.arqo_leads (
    cliente_id, source_id, etapa_id, grupo_id, empreendimento_id, observacoes,
    indicado_por_lead_id, created_by
  ) VALUES (
    v_cliente, v_source, v_etapa, v_grupo, p_empreendimento_id,
    NULLIF(btrim(p_observacoes),''), p_lead_origem_id, v_user
  ) RETURNING id INTO v_lead;

  INSERT INTO public.arqo_lead_events (lead_id, tipo, usuario_id, payload, comentario)
  VALUES (p_lead_origem_id, 'lead_indicado_gerado', v_user, jsonb_build_object('lead_indicado_id', v_lead), p_observacoes);
  INSERT INTO public.arqo_lead_events (lead_id, tipo, usuario_id, payload)
  VALUES (v_lead, 'indicacao_recebida', v_user, jsonb_build_object('lead_origem_id', p_lead_origem_id));
  RETURN v_lead;
END;
$$;

GRANT EXECUTE ON FUNCTION public.arqo_puxar_proximo_lead(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.arqo_contar_fila_usuario() TO authenticated;
GRANT EXECUTE ON FUNCTION public.arqo_concluir_atendimento(uuid,text,text,text,text,text,timestamptz,uuid,text,text,uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.arqo_criar_lead_indicado(uuid,text,text,text,uuid,text) TO authenticated;
