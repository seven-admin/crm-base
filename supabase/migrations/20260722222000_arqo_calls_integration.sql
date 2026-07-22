-- Integração Arqo com AstraCalls: uma sessão WhatsApp por usuário e histórico por lead.

CREATE TABLE public.arqo_call_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  external_session_id text NOT NULL UNIQUE,
  display_name text NOT NULL,
  whatsapp_jid text,
  state text NOT NULL DEFAULT 'connecting'
    CHECK (state IN ('connecting', 'qr', 'open', 'logged_out')),
  paired boolean NOT NULL DEFAULT false,
  last_seen_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.arqo_calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  lead_id uuid REFERENCES public.arqo_leads(id) ON DELETE SET NULL,
  external_session_id text NOT NULL,
  external_call_id text NOT NULL UNIQUE,
  phone text NOT NULL,
  direction text NOT NULL DEFAULT 'outbound'
    CHECK (direction IN ('outbound', 'inbound')),
  status text NOT NULL DEFAULT 'starting'
    CHECK (status IN ('starting', 'ringing', 'connected', 'ended', 'failed')),
  started_at timestamptz NOT NULL DEFAULT now(),
  connected_at timestamptz,
  ended_at timestamptz,
  duration_seconds integer,
  end_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX arqo_calls_user_started_idx
  ON public.arqo_calls (user_id, started_at DESC);
CREATE INDEX arqo_calls_lead_started_idx
  ON public.arqo_calls (lead_id, started_at DESC)
  WHERE lead_id IS NOT NULL;

ALTER TABLE public.arqo_call_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.arqo_calls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own call session"
  ON public.arqo_call_sessions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY "Users view own calls"
  ON public.arqo_calls
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

-- Escritas ficam restritas ao gateway, que usa service_role.
GRANT SELECT ON public.arqo_call_sessions TO authenticated;
GRANT SELECT ON public.arqo_calls TO authenticated;

CREATE TRIGGER update_arqo_call_sessions_updated_at
  BEFORE UPDATE ON public.arqo_call_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.arqo_set_call_duration()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.connected_at IS NOT NULL AND NEW.ended_at IS NOT NULL THEN
    NEW.duration_seconds := GREATEST(
      0,
      FLOOR(EXTRACT(EPOCH FROM (NEW.ended_at - NEW.connected_at)))::integer
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_arqo_call_duration
  BEFORE INSERT OR UPDATE ON public.arqo_calls
  FOR EACH ROW EXECUTE FUNCTION public.arqo_set_call_duration();

CREATE TRIGGER update_arqo_calls_updated_at
  BEFORE UPDATE ON public.arqo_calls
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
