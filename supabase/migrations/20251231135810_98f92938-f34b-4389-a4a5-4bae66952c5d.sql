-- Criar tabela de membros de evento
CREATE TABLE IF NOT EXISTS evento_membros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evento_id UUID REFERENCES eventos(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  papel TEXT DEFAULT 'membro',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(evento_id, user_id)
);

-- Habilitar RLS
ALTER TABLE evento_membros ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Admins can manage evento_membros"
  ON evento_membros FOR ALL
  USING (is_admin(auth.uid()));

CREATE POLICY "Marketing supervisors can manage evento_membros"
  ON evento_membros FOR ALL
  USING (is_marketing_supervisor(auth.uid()));

CREATE POLICY "Supervisor relacionamento can manage evento_membros"
  ON evento_membros FOR ALL
  USING (has_role(auth.uid(), 'supervisor_relacionamento'::app_role));