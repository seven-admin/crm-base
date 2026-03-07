-- 1. Add empreendimento_id to planejamento_fases
ALTER TABLE public.planejamento_fases
ADD COLUMN empreendimento_id uuid REFERENCES public.empreendimentos(id) ON DELETE CASCADE DEFAULT NULL;

CREATE INDEX idx_planejamento_fases_empreendimento 
ON public.planejamento_fases(empreendimento_id);

-- 2. Create google_calendar_embeds table
CREATE TABLE public.google_calendar_embeds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  nome text NOT NULL DEFAULT 'Google Calendar',
  embed_url text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.google_calendar_embeds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own calendar embeds"
ON public.google_calendar_embeds
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all calendar embeds"
ON public.google_calendar_embeds
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));