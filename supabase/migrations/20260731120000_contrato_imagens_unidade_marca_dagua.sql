-- Imagens por unidade (planta + garagem) usadas na aba memorial e no fim do contrato
ALTER TABLE seven_unidades
  ADD COLUMN IF NOT EXISTS imagem_planta_url text,
  ADD COLUMN IF NOT EXISTS imagem_garagem_url text;

-- Marca d'água por modelo de contrato (aplicada em todas as páginas na geração do PDF)
ALTER TABLE nexa_contrato_templates
  ADD COLUMN IF NOT EXISTS marca_dagua_url text,
  ADD COLUMN IF NOT EXISTS marca_dagua_opacidade numeric NOT NULL DEFAULT 0.08;
