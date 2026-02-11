DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE c.contype = 'u'
      AND n.nspname = 'public'
      AND t.relname = 'imobiliarias'
      AND EXISTS (
        SELECT 1
        FROM unnest(c.conkey) AS k(attnum)
        JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = k.attnum
        WHERE a.attname = 'cnpj'
      )
  ) LOOP
    EXECUTE format('ALTER TABLE public.imobiliarias DROP CONSTRAINT %I', r.conname);
  END LOOP;
END $$;