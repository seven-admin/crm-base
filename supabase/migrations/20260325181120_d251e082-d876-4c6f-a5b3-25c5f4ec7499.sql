-- Add data_venda column to unidades
ALTER TABLE unidades ADD COLUMN data_venda timestamptz;

-- Backfill existing vendidas with updated_at as best approximation
UPDATE unidades SET data_venda = updated_at WHERE status = 'vendida';

-- Trigger to auto-set data_venda on status change
CREATE OR REPLACE FUNCTION public.set_data_venda()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NEW.status = 'vendida' AND (OLD.status IS DISTINCT FROM 'vendida') THEN
    NEW.data_venda = now();
  ELSIF NEW.status != 'vendida' THEN
    NEW.data_venda = NULL;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_set_data_venda
BEFORE UPDATE ON unidades FOR EACH ROW EXECUTE FUNCTION public.set_data_venda();