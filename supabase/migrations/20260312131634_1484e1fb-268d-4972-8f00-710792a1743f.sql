-- Marcar etapas relevantes como visíveis para incorporador
UPDATE public.funil_etapas 
SET visivel_incorporador = true 
WHERE nome IN ('Negociação', 'Retorno do incorporador') 
  AND visivel_incorporador = false;

-- Garantir que incorporadores podem ler funil_etapas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'funil_etapas' 
    AND policyname = 'Incorporadores podem ler etapas'
  ) THEN
    CREATE POLICY "Incorporadores podem ler etapas"
      ON public.funil_etapas
      FOR SELECT
      TO authenticated
      USING (
        public.is_incorporador(auth.uid()) AND is_active = true
      );
  END IF;
END $$;