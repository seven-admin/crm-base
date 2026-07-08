
DO $$ BEGIN
  CREATE TYPE public.nivel_cadastro_cliente AS ENUM ('lead', 'qualificado', 'comprador');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.clientes
  ADD COLUMN IF NOT EXISTS nivel_cadastro public.nivel_cadastro_cliente NOT NULL DEFAULT 'lead',
  ADD COLUMN IF NOT EXISTS data_promocao_qualificado timestamptz,
  ADD COLUMN IF NOT EXISTS data_promocao_comprador timestamptz;

CREATE INDEX IF NOT EXISTS idx_clientes_nivel_cadastro ON public.clientes(nivel_cadastro);

-- Backfill ANTES do trigger
UPDATE public.clientes
SET nivel_cadastro = 'comprador',
    data_promocao_qualificado = COALESCE(data_promocao_qualificado, created_at),
    data_promocao_comprador = COALESCE(data_promocao_comprador, created_at)
WHERE nivel_cadastro = 'lead'
  AND ((tipo_pessoa = 'juridica' AND cnpj IS NOT NULL) OR (tipo_pessoa <> 'juridica' AND cpf IS NOT NULL))
  AND endereco_cep IS NOT NULL AND endereco_logradouro IS NOT NULL
  AND endereco_numero IS NOT NULL AND endereco_bairro IS NOT NULL
  AND endereco_cidade IS NOT NULL AND endereco_uf IS NOT NULL;

UPDATE public.clientes
SET nivel_cadastro = 'qualificado',
    data_promocao_qualificado = COALESCE(data_promocao_qualificado, created_at)
WHERE nivel_cadastro = 'lead'
  AND telefone IS NOT NULL AND email IS NOT NULL;

CREATE OR REPLACE FUNCTION public.validate_nivel_cadastro_cliente()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.nivel_cadastro = 'lead' THEN
    IF NEW.nome IS NULL OR btrim(NEW.nome) = '' THEN
      RAISE EXCEPTION 'Nome é obrigatório';
    END IF;
    IF (NEW.telefone IS NULL OR btrim(NEW.telefone) = '')
       AND (NEW.email IS NULL OR btrim(NEW.email) = '') THEN
      RAISE EXCEPTION 'Informe pelo menos telefone ou email para o lead';
    END IF;
  END IF;

  IF NEW.nivel_cadastro IN ('qualificado', 'comprador') THEN
    IF NEW.telefone IS NULL OR btrim(NEW.telefone) = '' THEN
      RAISE EXCEPTION 'Telefone é obrigatório a partir de qualificado';
    END IF;
    IF NEW.email IS NULL OR btrim(NEW.email) = '' THEN
      RAISE EXCEPTION 'Email é obrigatório a partir de qualificado';
    END IF;
  END IF;

  IF NEW.nivel_cadastro = 'comprador' THEN
    IF NEW.tipo_pessoa = 'juridica' THEN
      IF NEW.cnpj IS NULL OR btrim(NEW.cnpj) = '' THEN
        RAISE EXCEPTION 'CNPJ é obrigatório para comprador PJ';
      END IF;
      IF NEW.razao_social IS NULL OR btrim(NEW.razao_social) = '' THEN
        RAISE EXCEPTION 'Razão social é obrigatória para comprador PJ';
      END IF;
    ELSE
      IF (NEW.cpf IS NULL OR btrim(NEW.cpf) = '')
         AND (NEW.passaporte IS NULL OR btrim(NEW.passaporte) = '') THEN
        RAISE EXCEPTION 'CPF ou passaporte é obrigatório para comprador PF';
      END IF;
    END IF;
    IF NEW.endereco_cep IS NULL OR NEW.endereco_logradouro IS NULL
       OR NEW.endereco_numero IS NULL OR NEW.endereco_bairro IS NULL
       OR NEW.endereco_cidade IS NULL OR NEW.endereco_uf IS NULL THEN
      RAISE EXCEPTION 'Endereço completo é obrigatório para comprador';
    END IF;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.nivel_cadastro = 'qualificado' AND NEW.data_promocao_qualificado IS NULL THEN
      NEW.data_promocao_qualificado := now();
    END IF;
    IF NEW.nivel_cadastro = 'comprador' THEN
      IF NEW.data_promocao_qualificado IS NULL THEN
        NEW.data_promocao_qualificado := now();
      END IF;
      IF NEW.data_promocao_comprador IS NULL THEN
        NEW.data_promocao_comprador := now();
      END IF;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.nivel_cadastro = 'qualificado' AND OLD.nivel_cadastro = 'lead' THEN
      NEW.data_promocao_qualificado := COALESCE(NEW.data_promocao_qualificado, now());
    END IF;
    IF NEW.nivel_cadastro = 'comprador' AND OLD.nivel_cadastro <> 'comprador' THEN
      NEW.data_promocao_comprador := COALESCE(NEW.data_promocao_comprador, now());
      IF NEW.data_promocao_qualificado IS NULL THEN
        NEW.data_promocao_qualificado := now();
      END IF;
    END IF;
    IF (OLD.nivel_cadastro = 'comprador' AND NEW.nivel_cadastro <> 'comprador')
       OR (OLD.nivel_cadastro = 'qualificado' AND NEW.nivel_cadastro = 'lead') THEN
      RAISE EXCEPTION 'Não é permitido regredir o nível de cadastro do cliente';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_nivel_cadastro_cliente ON public.clientes;
CREATE TRIGGER trg_validate_nivel_cadastro_cliente
  BEFORE INSERT OR UPDATE ON public.clientes
  FOR EACH ROW EXECUTE FUNCTION public.validate_nivel_cadastro_cliente();
