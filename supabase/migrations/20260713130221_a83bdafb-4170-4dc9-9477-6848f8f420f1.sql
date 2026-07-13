
-- ============ 1. Nexa - Biblioteca de blocos de texto ============
CREATE TABLE public.nexa_contrato_blocos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  categoria TEXT NOT NULL DEFAULT 'geral',
  descricao TEXT,
  conteudo_html TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.nexa_contrato_blocos TO authenticated;
GRANT ALL ON public.nexa_contrato_blocos TO service_role;

ALTER TABLE public.nexa_contrato_blocos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Nexa/Seven podem ver blocos"
  ON public.nexa_contrato_blocos FOR SELECT TO authenticated
  USING (public.is_nexa_user(auth.uid()) OR public.is_seven_team(auth.uid()) OR public.is_admin(auth.uid()));

CREATE POLICY "Nexa/Admin podem gerenciar blocos"
  ON public.nexa_contrato_blocos FOR ALL TO authenticated
  USING (public.is_nexa_user(auth.uid()) OR public.is_admin(auth.uid()))
  WITH CHECK (public.is_nexa_user(auth.uid()) OR public.is_admin(auth.uid()));

CREATE TRIGGER trg_nexa_contrato_blocos_updated_at
  BEFORE UPDATE ON public.nexa_contrato_blocos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ 2. Domínios Google permitidos ============
CREATE TABLE public.sistema_dominios_google_permitidos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dominio TEXT NOT NULL UNIQUE,
  empresa_default TEXT NOT NULL DEFAULT 'seven',
  descricao TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT sistema_dominios_google_empresa_check
    CHECK (empresa_default IN ('seven','arqo','nexa','incorporador','externo'))
);

GRANT SELECT ON public.sistema_dominios_google_permitidos TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sistema_dominios_google_permitidos TO authenticated;
GRANT ALL ON public.sistema_dominios_google_permitidos TO service_role;

ALTER TABLE public.sistema_dominios_google_permitidos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Qualquer um pode consultar dominios permitidos"
  ON public.sistema_dominios_google_permitidos FOR SELECT
  USING (true);

CREATE POLICY "Somente super_admin gerencia dominios"
  ON public.sistema_dominios_google_permitidos FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

CREATE TRIGGER trg_sistema_dominios_google_updated_at
  BEFORE UPDATE ON public.sistema_dominios_google_permitidos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.sistema_dominios_google_permitidos (dominio, empresa_default, descricao) VALUES
  ('sevengroup360.com.br', 'seven', 'Seven Group'),
  ('nexaresolve.com.br', 'nexa', 'Nexa'),
  ('arqoimob.com.br', 'arqo', 'Arqo');

-- ============ 3. RPC hard delete em lote de leads Arqo ============
CREATE OR REPLACE FUNCTION public.arqo_delete_leads_bulk(
  p_lead_ids UUID[],
  p_delete_lead_clients BOOLEAN DEFAULT false
) RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INT := 0;
  v_client_ids UUID[];
BEGIN
  IF NOT (public.is_admin(auth.uid()) OR public.is_super_admin(auth.uid())) THEN
    RAISE EXCEPTION 'Somente administradores podem excluir leads em lote';
  END IF;

  IF p_lead_ids IS NULL OR array_length(p_lead_ids, 1) IS NULL THEN
    RETURN 0;
  END IF;

  -- captura clientes associados (para eventual exclusão)
  SELECT array_agg(DISTINCT cliente_id) INTO v_client_ids
    FROM public.arqo_leads WHERE id = ANY(p_lead_ids) AND cliente_id IS NOT NULL;

  -- Exclui dependências
  DELETE FROM public.arqo_lead_events WHERE lead_id = ANY(p_lead_ids);
  DELETE FROM public.arqo_agendamentos WHERE lead_id = ANY(p_lead_ids);
  DELETE FROM public.arqo_oportunidade_responsaveis WHERE lead_id = ANY(p_lead_ids);

  DELETE FROM public.arqo_leads WHERE id = ANY(p_lead_ids);
  GET DIAGNOSTICS v_count = ROW_COUNT;

  -- Opcional: exclui clientes nível 'lead' sem outras referências
  IF p_delete_lead_clients AND v_client_ids IS NOT NULL THEN
    DELETE FROM public.seven_clientes c
    WHERE c.id = ANY(v_client_ids)
      AND c.nivel_cadastro = 'lead'
      AND NOT EXISTS (SELECT 1 FROM public.arqo_leads l WHERE l.cliente_id = c.id);
  END IF;

  RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.arqo_delete_leads_bulk(UUID[], BOOLEAN) TO authenticated;
