-- Permite usar a imagem do template como FUNDO de página inteira (papel timbrado),
-- atrás do texto, em vez da marca d'água pequena e centralizada.
ALTER TABLE nexa_contrato_templates
  ADD COLUMN IF NOT EXISTS marca_dagua_fundo boolean NOT NULL DEFAULT false;
