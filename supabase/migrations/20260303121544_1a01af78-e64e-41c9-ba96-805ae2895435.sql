
-- Add column for selected variables per webhook
ALTER TABLE webhooks ADD COLUMN variaveis_selecionadas text[] DEFAULT NULL;

-- Table of available variables per event
CREATE TABLE webhook_variaveis_disponiveis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evento text NOT NULL,
  chave text NOT NULL,
  label text NOT NULL,
  categoria text DEFAULT 'geral',
  tipo text DEFAULT 'text',
  created_at timestamptz DEFAULT now(),
  UNIQUE(evento, chave)
);

-- RLS
ALTER TABLE webhook_variaveis_disponiveis ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read_webhook_vars" ON webhook_variaveis_disponiveis FOR SELECT TO authenticated USING (true);
CREATE POLICY "manage_webhook_vars_insert" ON webhook_variaveis_disponiveis FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "manage_webhook_vars_update" ON webhook_variaveis_disponiveis FOR UPDATE TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "manage_webhook_vars_delete" ON webhook_variaveis_disponiveis FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));
