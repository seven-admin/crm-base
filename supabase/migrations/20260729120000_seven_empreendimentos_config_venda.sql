-- Configuração da "tabela de vendas" por empreendimento: percentuais do fluxo de
-- entrada (ato/mensais/reforços) + textos do rodapé do PDF comercial.
-- Um único bag jsonb; os valores em reais NÃO são armazenados — derivam do valor
-- da unidade no momento da exportação. Ver src/lib/exportUnidadesDisponiveisPdf.ts.
ALTER TABLE public.seven_empreendimentos
  ADD COLUMN IF NOT EXISTS config_venda jsonb NOT NULL DEFAULT '{}'::jsonb;
