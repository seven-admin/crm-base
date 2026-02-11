-- Adicionar campo motivo à tabela de histórico de preços se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'unidade_historico_precos' 
    AND column_name = 'motivo'
  ) THEN
    ALTER TABLE public.unidade_historico_precos ADD COLUMN motivo TEXT;
  END IF;
END $$;

COMMENT ON COLUMN public.unidade_historico_precos.motivo IS 'Motivo do reajuste (ex: IPCA 2025, Reajuste Anual)';