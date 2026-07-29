-- Remove a coluna texto_rodape_relatorio: a exportação de unidades virou apenas
-- "tabela de vendas" e o campo (antiga caixa de observações do PDF) não é mais usado.
ALTER TABLE public.seven_empreendimentos
  DROP COLUMN IF EXISTS texto_rodape_relatorio;
