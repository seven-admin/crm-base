
CREATE TYPE public.nexa_visita_status AS ENUM ('agendada','confirmada','realizada','no_show','cancelada');

INSERT INTO public.roles (name, display_name, description, is_active)
VALUES 
  ('nexa_admin', 'Nexa - Administrador', 'Administrador do módulo Nexa', true),
  ('nexa_gestor', 'Nexa - Gestor', 'Gestor de visitas Nexa', true),
  ('nexa_corretor', 'Nexa - Corretor', 'Corretor operando visitas Nexa', true)
ON CONFLICT (name) DO NOTHING;

CREATE OR REPLACE FUNCTION public.is_nexa_user(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.roles r ON r.id = ur.role_id
    WHERE ur.user_id = _user_id
      AND r.name IN ('nexa_admin','nexa_gestor','nexa_corretor')
      AND r.is_active = true
  )
$$;

CREATE TABLE public.nexa_visitas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid REFERENCES public.clientes(id) ON DELETE SET NULL,
  visitante_nome text,
  visitante_telefone text,
  empreendimento_id uuid NOT NULL REFERENCES public.empreendimentos(id) ON DELETE RESTRICT,
  imobiliaria_parceira_id uuid REFERENCES public.imobiliarias(id) ON DELETE SET NULL,
  corretor_id uuid REFERENCES public.corretores(id) ON DELETE SET NULL,
  data_hora timestamptz NOT NULL,
  status public.nexa_visita_status NOT NULL DEFAULT 'agendada',
  arqo_lead_id uuid REFERENCES public.arqo_leads(id) ON DELETE SET NULL,
  google_event_id text,
  observacoes text,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT nexa_visitas_identidade_chk CHECK (
    cliente_id IS NOT NULL 
    OR (visitante_nome IS NOT NULL AND btrim(visitante_nome) <> ''
        AND visitante_telefone IS NOT NULL AND btrim(visitante_telefone) <> '')
  )
);

CREATE INDEX idx_nexa_visitas_empreendimento ON public.nexa_visitas(empreendimento_id);
CREATE INDEX idx_nexa_visitas_cliente ON public.nexa_visitas(cliente_id);
CREATE INDEX idx_nexa_visitas_data ON public.nexa_visitas(data_hora);
CREATE INDEX idx_nexa_visitas_status ON public.nexa_visitas(status);
CREATE INDEX idx_nexa_visitas_arqo_lead ON public.nexa_visitas(arqo_lead_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.nexa_visitas TO authenticated;
GRANT ALL ON public.nexa_visitas TO service_role;
ALTER TABLE public.nexa_visitas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Nexa users view visitas" ON public.nexa_visitas FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()) OR public.is_nexa_user(auth.uid()));
CREATE POLICY "Nexa users insert visitas" ON public.nexa_visitas FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()) OR public.is_nexa_user(auth.uid()));
CREATE POLICY "Nexa users update visitas" ON public.nexa_visitas FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()) OR public.is_nexa_user(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()) OR public.is_nexa_user(auth.uid()));
CREATE POLICY "Admins delete visitas" ON public.nexa_visitas FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE TRIGGER trg_nexa_visitas_updated_at BEFORE UPDATE ON public.nexa_visitas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.nexa_visitas_eventos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visita_id uuid NOT NULL REFERENCES public.nexa_visitas(id) ON DELETE CASCADE,
  tipo_evento text NOT NULL,
  unidade_id uuid REFERENCES public.unidades(id) ON DELETE SET NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  usuario_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_nexa_eventos_visita ON public.nexa_visitas_eventos(visita_id);

GRANT SELECT, INSERT ON public.nexa_visitas_eventos TO authenticated;
GRANT ALL ON public.nexa_visitas_eventos TO service_role;
ALTER TABLE public.nexa_visitas_eventos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Nexa users view eventos" ON public.nexa_visitas_eventos FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()) OR public.is_nexa_user(auth.uid()));
CREATE POLICY "Nexa users insert eventos" ON public.nexa_visitas_eventos FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()) OR public.is_nexa_user(auth.uid()));

CREATE OR REPLACE FUNCTION public.nexa_eventos_readonly()
RETURNS trigger LANGUAGE plpgsql SET search_path = public
AS $$ BEGIN RAISE EXCEPTION 'Eventos de visita são imutáveis'; END; $$;

CREATE TRIGGER trg_nexa_eventos_no_update
  BEFORE UPDATE OR DELETE ON public.nexa_visitas_eventos
  FOR EACH ROW EXECUTE FUNCTION public.nexa_eventos_readonly();

CREATE TABLE public.nexa_contratos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visita_id uuid REFERENCES public.nexa_visitas(id) ON DELETE SET NULL,
  unidade_id uuid REFERENCES public.unidades(id) ON DELETE SET NULL,
  valor numeric(14,2),
  status text NOT NULL DEFAULT 'rascunho',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.nexa_contratos TO authenticated;
GRANT ALL ON public.nexa_contratos TO service_role;
ALTER TABLE public.nexa_contratos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Nexa users view contratos" ON public.nexa_contratos FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()) OR public.is_nexa_user(auth.uid()));
CREATE POLICY "Nexa users manage contratos" ON public.nexa_contratos FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()) OR public.is_nexa_user(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()) OR public.is_nexa_user(auth.uid()));
CREATE TRIGGER trg_nexa_contratos_updated_at BEFORE UPDATE ON public.nexa_contratos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
