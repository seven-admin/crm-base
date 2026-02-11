-- Atualiza trigger de padronização (clientes):
-- - Campos OPÇÃO A em caixa alta (inclui endereco_uf)
-- - Email sempre lowercase

CREATE OR REPLACE FUNCTION public.uppercase_clientes()
RETURNS TRIGGER AS $$
BEGIN
  -- Email sempre lowercase
  IF NEW.email IS NOT NULL THEN NEW.email = LOWER(NEW.email); END IF;

  -- OPÇÃO A: campos de texto livres/identificação em CAIXA ALTA
  IF NEW.nome IS NOT NULL THEN NEW.nome = UPPER(NEW.nome); END IF;
  IF NEW.endereco_logradouro IS NOT NULL THEN NEW.endereco_logradouro = UPPER(NEW.endereco_logradouro); END IF;
  IF NEW.endereco_bairro IS NOT NULL THEN NEW.endereco_bairro = UPPER(NEW.endereco_bairro); END IF;
  IF NEW.endereco_cidade IS NOT NULL THEN NEW.endereco_cidade = UPPER(NEW.endereco_cidade); END IF;
  IF NEW.endereco_complemento IS NOT NULL THEN NEW.endereco_complemento = UPPER(NEW.endereco_complemento); END IF;
  IF NEW.endereco_uf IS NOT NULL THEN NEW.endereco_uf = UPPER(NEW.endereco_uf); END IF;
  IF NEW.nome_mae IS NOT NULL THEN NEW.nome_mae = UPPER(NEW.nome_mae); END IF;
  IF NEW.nome_pai IS NOT NULL THEN NEW.nome_pai = UPPER(NEW.nome_pai); END IF;
  IF NEW.profissao IS NOT NULL THEN NEW.profissao = UPPER(NEW.profissao); END IF;
  IF NEW.nacionalidade IS NOT NULL THEN NEW.nacionalidade = UPPER(NEW.nacionalidade); END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger já existe; manter como está (reaponta automaticamente para a função atualizada).