
-- 1. Default send_campanha = '1'
ALTER TABLE public.corretores ALTER COLUMN send_campanha SET DEFAULT '1';

-- 2. Coluna cod_sorteio
ALTER TABLE public.corretores ADD COLUMN IF NOT EXISTS cod_sorteio text UNIQUE;

-- 3. Função geradora do código formato 0000-X0X0-XXXX
CREATE OR REPLACE FUNCTION public.generate_cod_sorteio()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  chars text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  digits text := '0123456789';
  result text;
  attempts int := 0;
BEGIN
  LOOP
    result :=
      substr(digits, floor(random()*10+1)::int, 1) ||
      substr(digits, floor(random()*10+1)::int, 1) ||
      substr(digits, floor(random()*10+1)::int, 1) ||
      substr(digits, floor(random()*10+1)::int, 1) || '-' ||
      substr(chars, floor(random()*26+1)::int, 1) ||
      substr(digits, floor(random()*10+1)::int, 1) ||
      substr(chars, floor(random()*26+1)::int, 1) ||
      substr(digits, floor(random()*10+1)::int, 1) || '-' ||
      substr(chars, floor(random()*26+1)::int, 1) ||
      substr(chars, floor(random()*26+1)::int, 1) ||
      substr(chars, floor(random()*26+1)::int, 1) ||
      substr(chars, floor(random()*26+1)::int, 1);

    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.corretores WHERE cod_sorteio = result);
    attempts := attempts + 1;
    IF attempts > 100 THEN RAISE EXCEPTION 'Não foi possível gerar código único'; END IF;
  END LOOP;
  RETURN result;
END;
$$;

-- 4. Trigger para gerar automaticamente em novos cadastros
CREATE OR REPLACE FUNCTION public.set_cod_sorteio()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$ BEGIN
  IF NEW.cod_sorteio IS NULL THEN
    NEW.cod_sorteio := public.generate_cod_sorteio();
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_set_cod_sorteio ON public.corretores;
CREATE TRIGGER trg_set_cod_sorteio
BEFORE INSERT ON public.corretores
FOR EACH ROW EXECUTE FUNCTION public.set_cod_sorteio();

-- 5. Backfill — gerar código para corretores já existentes
UPDATE public.corretores
SET cod_sorteio = public.generate_cod_sorteio()
WHERE cod_sorteio IS NULL;

-- 6. Coluna qtd_corretores na tabela atividades
ALTER TABLE public.atividades ADD COLUMN IF NOT EXISTS qtd_corretores integer;
