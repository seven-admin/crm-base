
-- =============================================
-- FUNÇÕES ESPECÍFICAS PARA UPPERCASE (CORRIGIDO)
-- =============================================

-- Função para CLIENTES
CREATE OR REPLACE FUNCTION public.uppercase_clientes()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.nome IS NOT NULL THEN NEW.nome = UPPER(NEW.nome); END IF;
  IF NEW.endereco_logradouro IS NOT NULL THEN NEW.endereco_logradouro = UPPER(NEW.endereco_logradouro); END IF;
  IF NEW.endereco_bairro IS NOT NULL THEN NEW.endereco_bairro = UPPER(NEW.endereco_bairro); END IF;
  IF NEW.endereco_cidade IS NOT NULL THEN NEW.endereco_cidade = UPPER(NEW.endereco_cidade); END IF;
  IF NEW.endereco_complemento IS NOT NULL THEN NEW.endereco_complemento = UPPER(NEW.endereco_complemento); END IF;
  IF NEW.nome_mae IS NOT NULL THEN NEW.nome_mae = UPPER(NEW.nome_mae); END IF;
  IF NEW.nome_pai IS NOT NULL THEN NEW.nome_pai = UPPER(NEW.nome_pai); END IF;
  IF NEW.profissao IS NOT NULL THEN NEW.profissao = UPPER(NEW.profissao); END IF;
  IF NEW.nacionalidade IS NOT NULL THEN NEW.nacionalidade = UPPER(NEW.nacionalidade); END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Função para CORRETORES
CREATE OR REPLACE FUNCTION public.uppercase_corretores()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.nome_completo IS NOT NULL THEN NEW.nome_completo = UPPER(NEW.nome_completo); END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Função para IMOBILIARIAS (sem razao_social)
CREATE OR REPLACE FUNCTION public.uppercase_imobiliarias()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.nome IS NOT NULL THEN NEW.nome = UPPER(NEW.nome); END IF;
  IF NEW.endereco_logradouro IS NOT NULL THEN NEW.endereco_logradouro = UPPER(NEW.endereco_logradouro); END IF;
  IF NEW.endereco_bairro IS NOT NULL THEN NEW.endereco_bairro = UPPER(NEW.endereco_bairro); END IF;
  IF NEW.endereco_cidade IS NOT NULL THEN NEW.endereco_cidade = UPPER(NEW.endereco_cidade); END IF;
  IF NEW.endereco_complemento IS NOT NULL THEN NEW.endereco_complemento = UPPER(NEW.endereco_complemento); END IF;
  IF NEW.gestor_nome IS NOT NULL THEN NEW.gestor_nome = UPPER(NEW.gestor_nome); END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Função para INCORPORADORAS (tem razao_social)
CREATE OR REPLACE FUNCTION public.uppercase_incorporadoras()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.nome IS NOT NULL THEN NEW.nome = UPPER(NEW.nome); END IF;
  IF NEW.razao_social IS NOT NULL THEN NEW.razao_social = UPPER(NEW.razao_social); END IF;
  IF NEW.endereco_logradouro IS NOT NULL THEN NEW.endereco_logradouro = UPPER(NEW.endereco_logradouro); END IF;
  IF NEW.endereco_bairro IS NOT NULL THEN NEW.endereco_bairro = UPPER(NEW.endereco_bairro); END IF;
  IF NEW.endereco_cidade IS NOT NULL THEN NEW.endereco_cidade = UPPER(NEW.endereco_cidade); END IF;
  IF NEW.endereco_complemento IS NOT NULL THEN NEW.endereco_complemento = UPPER(NEW.endereco_complemento); END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Função para EMPREENDIMENTOS
CREATE OR REPLACE FUNCTION public.uppercase_empreendimentos()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.nome IS NOT NULL THEN NEW.nome = UPPER(NEW.nome); END IF;
  IF NEW.endereco_logradouro IS NOT NULL THEN NEW.endereco_logradouro = UPPER(NEW.endereco_logradouro); END IF;
  IF NEW.endereco_bairro IS NOT NULL THEN NEW.endereco_bairro = UPPER(NEW.endereco_bairro); END IF;
  IF NEW.endereco_cidade IS NOT NULL THEN NEW.endereco_cidade = UPPER(NEW.endereco_cidade); END IF;
  IF NEW.endereco_complemento IS NOT NULL THEN NEW.endereco_complemento = UPPER(NEW.endereco_complemento); END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Função para BLOCOS
CREATE OR REPLACE FUNCTION public.uppercase_blocos()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.nome IS NOT NULL THEN NEW.nome = UPPER(NEW.nome); END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Função para TIPOLOGIAS
CREATE OR REPLACE FUNCTION public.uppercase_tipologias()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.nome IS NOT NULL THEN NEW.nome = UPPER(NEW.nome); END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- =============================================
-- TRIGGERS
-- =============================================

DROP TRIGGER IF EXISTS trigger_uppercase_clientes ON public.clientes;
CREATE TRIGGER trigger_uppercase_clientes
  BEFORE INSERT OR UPDATE ON public.clientes
  FOR EACH ROW EXECUTE FUNCTION public.uppercase_clientes();

DROP TRIGGER IF EXISTS trigger_uppercase_corretores ON public.corretores;
CREATE TRIGGER trigger_uppercase_corretores
  BEFORE INSERT OR UPDATE ON public.corretores
  FOR EACH ROW EXECUTE FUNCTION public.uppercase_corretores();

DROP TRIGGER IF EXISTS trigger_uppercase_imobiliarias ON public.imobiliarias;
CREATE TRIGGER trigger_uppercase_imobiliarias
  BEFORE INSERT OR UPDATE ON public.imobiliarias
  FOR EACH ROW EXECUTE FUNCTION public.uppercase_imobiliarias();

DROP TRIGGER IF EXISTS trigger_uppercase_incorporadoras ON public.incorporadoras;
CREATE TRIGGER trigger_uppercase_incorporadoras
  BEFORE INSERT OR UPDATE ON public.incorporadoras
  FOR EACH ROW EXECUTE FUNCTION public.uppercase_incorporadoras();

DROP TRIGGER IF EXISTS trigger_uppercase_empreendimentos ON public.empreendimentos;
CREATE TRIGGER trigger_uppercase_empreendimentos
  BEFORE INSERT OR UPDATE ON public.empreendimentos
  FOR EACH ROW EXECUTE FUNCTION public.uppercase_empreendimentos();

DROP TRIGGER IF EXISTS trigger_uppercase_blocos ON public.blocos;
CREATE TRIGGER trigger_uppercase_blocos
  BEFORE INSERT OR UPDATE ON public.blocos
  FOR EACH ROW EXECUTE FUNCTION public.uppercase_blocos();

DROP TRIGGER IF EXISTS trigger_uppercase_tipologias ON public.tipologias;
CREATE TRIGGER trigger_uppercase_tipologias
  BEFORE INSERT OR UPDATE ON public.tipologias
  FOR EACH ROW EXECUTE FUNCTION public.uppercase_tipologias();

-- =============================================
-- CATEGORIA PARA TIPOLOGIAS
-- =============================================

CREATE TYPE tipologia_categoria AS ENUM ('casa', 'apartamento', 'terreno');

ALTER TABLE public.tipologias 
  ADD COLUMN categoria tipologia_categoria NOT NULL DEFAULT 'apartamento';

-- =============================================
-- ATUALIZAR DADOS EXISTENTES
-- =============================================

UPDATE public.clientes SET nome = UPPER(nome) WHERE nome IS NOT NULL AND nome != UPPER(nome);
UPDATE public.corretores SET nome_completo = UPPER(nome_completo) WHERE nome_completo IS NOT NULL AND nome_completo != UPPER(nome_completo);
UPDATE public.imobiliarias SET nome = UPPER(nome) WHERE nome IS NOT NULL AND nome != UPPER(nome);
UPDATE public.incorporadoras SET nome = UPPER(nome) WHERE nome IS NOT NULL AND nome != UPPER(nome);
UPDATE public.empreendimentos SET nome = UPPER(nome) WHERE nome IS NOT NULL AND nome != UPPER(nome);
UPDATE public.blocos SET nome = UPPER(nome) WHERE nome IS NOT NULL AND nome != UPPER(nome);
UPDATE public.tipologias SET nome = UPPER(nome) WHERE nome IS NOT NULL AND nome != UPPER(nome);
