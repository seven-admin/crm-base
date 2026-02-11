-- Create webhooks table for n8n integrations
CREATE TABLE public.webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evento TEXT NOT NULL,
  url TEXT NOT NULL,
  descricao TEXT,
  is_active BOOLEAN DEFAULT true,
  ultimo_disparo TIMESTAMPTZ,
  ultimo_status INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;

-- Only admins can manage webhooks
CREATE POLICY "Admins can manage webhooks"
  ON public.webhooks FOR ALL
  USING (is_admin(auth.uid()));

-- Create updated_at trigger
CREATE TRIGGER update_webhooks_updated_at
  BEFORE UPDATE ON public.webhooks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();