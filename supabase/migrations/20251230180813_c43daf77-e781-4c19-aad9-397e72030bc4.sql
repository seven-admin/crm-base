-- =====================================================
-- ETAPA 9: PORTAL DO CORRETOR - RESERVAS TEMPORÁRIAS
-- =====================================================

-- Create sequence for reserva numbering
CREATE SEQUENCE IF NOT EXISTS reserva_protocolo_seq START 1;

-- Create enum for reserva status
CREATE TYPE reserva_status AS ENUM ('ativa', 'expirada', 'convertida', 'cancelada');

-- =====================================================
-- TABLE: reservas_temporarias
-- =====================================================
CREATE TABLE public.reservas_temporarias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  protocolo TEXT NOT NULL,
  corretor_id UUID NOT NULL REFERENCES public.corretores(id) ON DELETE RESTRICT,
  unidade_id UUID NOT NULL REFERENCES public.unidades(id) ON DELETE RESTRICT,
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
  empreendimento_id UUID NOT NULL REFERENCES public.empreendimentos(id) ON DELETE RESTRICT,
  data_reserva TIMESTAMPTZ NOT NULL DEFAULT now(),
  data_expiracao TIMESTAMPTZ NOT NULL,
  status reserva_status NOT NULL DEFAULT 'ativa',
  observacoes TEXT,
  notificacao_enviada BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Function to generate reserva protocolo
CREATE OR REPLACE FUNCTION generate_reserva_protocolo()
RETURNS TRIGGER AS $$
BEGIN
  NEW.protocolo := 'RES-' || LPAD(nextval('reserva_protocolo_seq')::TEXT, 5, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for auto-numbering
CREATE TRIGGER set_reserva_protocolo
  BEFORE INSERT ON public.reservas_temporarias
  FOR EACH ROW
  EXECUTE FUNCTION generate_reserva_protocolo();

-- Trigger for updated_at
CREATE TRIGGER update_reservas_temporarias_updated_at
  BEFORE UPDATE ON public.reservas_temporarias
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- TABLE: reserva_documentos
-- =====================================================
CREATE TABLE public.reserva_documentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reserva_id UUID NOT NULL REFERENCES public.reservas_temporarias(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  nome TEXT NOT NULL,
  arquivo_url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE public.reservas_temporarias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reserva_documentos ENABLE ROW LEVEL SECURITY;

-- Reservas policies
CREATE POLICY "Admins can manage reservas_temporarias" ON public.reservas_temporarias
  FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Gestores can manage reservas_temporarias" ON public.reservas_temporarias
  FOR ALL USING (has_role(auth.uid(), 'gestor_produto'));

CREATE POLICY "Corretores can create reservas" ON public.reservas_temporarias
  FOR INSERT WITH CHECK (
    corretor_id IN (
      SELECT c.id FROM corretores c
      JOIN profiles p ON p.email = c.email
      WHERE p.id = auth.uid()
    )
  );

CREATE POLICY "Corretores can view own reservas" ON public.reservas_temporarias
  FOR SELECT USING (
    corretor_id IN (
      SELECT c.id FROM corretores c
      JOIN profiles p ON p.email = c.email
      WHERE p.id = auth.uid()
    )
  );

CREATE POLICY "Corretores can update own active reservas" ON public.reservas_temporarias
  FOR UPDATE USING (
    corretor_id IN (
      SELECT c.id FROM corretores c
      JOIN profiles p ON p.email = c.email
      WHERE p.id = auth.uid()
    )
    AND status = 'ativa'
  );

-- Reserva Documentos policies
CREATE POLICY "Admins can manage reserva_documentos" ON public.reserva_documentos
  FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Gestores can manage reserva_documentos" ON public.reserva_documentos
  FOR ALL USING (has_role(auth.uid(), 'gestor_produto'));

CREATE POLICY "Users can insert reserva_documentos" ON public.reserva_documentos
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view reserva_documentos" ON public.reserva_documentos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM reservas_temporarias r
      WHERE r.id = reserva_documentos.reserva_id
      AND (
        is_admin(auth.uid()) OR
        has_role(auth.uid(), 'gestor_produto') OR
        r.corretor_id IN (
          SELECT c.id FROM corretores c
          JOIN profiles p ON p.email = c.email
          WHERE p.id = auth.uid()
        )
      )
    )
  );

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX idx_reservas_corretor ON public.reservas_temporarias(corretor_id);
CREATE INDEX idx_reservas_unidade ON public.reservas_temporarias(unidade_id);
CREATE INDEX idx_reservas_empreendimento ON public.reservas_temporarias(empreendimento_id);
CREATE INDEX idx_reservas_status ON public.reservas_temporarias(status);
CREATE INDEX idx_reservas_expiracao ON public.reservas_temporarias(data_expiracao);
CREATE INDEX idx_reserva_documentos_reserva ON public.reserva_documentos(reserva_id);

-- =====================================================
-- INSERT MODULE FOR PERMISSIONS
-- =====================================================
INSERT INTO public.modules (name, display_name, description, icon, route, is_active)
VALUES 
  ('portal_corretor', 'Portal do Corretor', 'Portal exclusivo para corretores', 'User', '/portal-corretor', true),
  ('reservas', 'Reservas', 'Gestão de reservas temporárias', 'Calendar', '/reservas', true)
ON CONFLICT DO NOTHING;

-- Grant permissions
INSERT INTO public.role_permissions (role, module_id, can_view, can_create, can_edit, can_delete, scope)
SELECT 'admin', m.id, true, true, true, true, 'global'
FROM public.modules m 
WHERE m.name IN ('portal_corretor', 'reservas')
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role, module_id, can_view, can_create, can_edit, can_delete, scope)
SELECT 'gestor_produto', m.id, true, true, true, true, 'global'
FROM public.modules m 
WHERE m.name IN ('portal_corretor', 'reservas')
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role, module_id, can_view, can_create, can_edit, can_delete, scope)
SELECT 'corretor', m.id, true, true, true, false, 'proprio'
FROM public.modules m 
WHERE m.name IN ('portal_corretor', 'reservas')
ON CONFLICT DO NOTHING;