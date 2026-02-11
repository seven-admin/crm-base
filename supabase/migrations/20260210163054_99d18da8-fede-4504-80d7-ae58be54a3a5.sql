
-- Create briefing_referencias table
CREATE TABLE public.briefing_referencias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  briefing_id UUID NOT NULL REFERENCES public.briefings(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('imagem', 'link')),
  url TEXT NOT NULL,
  titulo TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.briefing_referencias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage briefing_referencias"
  ON public.briefing_referencias FOR ALL
  TO authenticated USING (true) WITH CHECK (true);

-- Create storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('briefing-referencias', 'briefing-referencias', true);

CREATE POLICY "Authenticated users can upload briefing referencias"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'briefing-referencias');

CREATE POLICY "Anyone can view briefing referencias"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'briefing-referencias');

CREATE POLICY "Authenticated users can delete briefing referencias"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'briefing-referencias');
