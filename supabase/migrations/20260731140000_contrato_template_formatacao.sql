-- Formatação do PDF do contrato, por modelo: margens, cabeçalho/rodapé e numeração.
ALTER TABLE nexa_contrato_templates
  ADD COLUMN IF NOT EXISTS margem_topo numeric NOT NULL DEFAULT 20,
  ADD COLUMN IF NOT EXISTS margem_direita numeric NOT NULL DEFAULT 20,
  ADD COLUMN IF NOT EXISTS margem_baixo numeric NOT NULL DEFAULT 20,
  ADD COLUMN IF NOT EXISTS margem_esquerda numeric NOT NULL DEFAULT 20,
  ADD COLUMN IF NOT EXISTS cabecalho_texto text,
  ADD COLUMN IF NOT EXISTS rodape_texto text,
  ADD COLUMN IF NOT EXISTS numerar_paginas boolean NOT NULL DEFAULT false;
