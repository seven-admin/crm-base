
-- Tabela para registrar logs de disparos de webhooks
CREATE TABLE public.webhook_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id uuid REFERENCES public.webhooks(id) ON DELETE CASCADE,
  evento text NOT NULL,
  url text NOT NULL,
  payload jsonb,
  status_code integer,
  response_body text,
  tempo_ms integer,
  sucesso boolean NOT NULL DEFAULT false,
  erro text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

-- Admins podem visualizar os logs
CREATE POLICY "Admins can view webhook logs"
  ON public.webhook_logs FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

-- Service role pode inserir (usado pela edge function)
CREATE POLICY "Service role can insert webhook logs"
  ON public.webhook_logs FOR INSERT TO service_role
  WITH CHECK (true);

-- Índices para performance
CREATE INDEX idx_webhook_logs_webhook_id ON public.webhook_logs(webhook_id);
CREATE INDEX idx_webhook_logs_created_at ON public.webhook_logs(created_at DESC);
CREATE INDEX idx_webhook_logs_evento ON public.webhook_logs(evento);
