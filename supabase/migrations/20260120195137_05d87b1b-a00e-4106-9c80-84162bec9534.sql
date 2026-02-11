-- Adicionar nova categoria de ticket de marketing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum
    WHERE enumlabel = 'pedido_orcamento'
      AND enumtypid = 'categoria_projeto'::regtype
  ) THEN
    ALTER TYPE categoria_projeto ADD VALUE 'pedido_orcamento';
  END IF;
END $$;
