-- Adicionar variável {{condicoes_pagamento}} à tabela contrato_variaveis
INSERT INTO public.contrato_variaveis (chave, label, categoria, origem, campo_origem, exemplo, tipo, is_sistema, is_active)
VALUES (
  'condicoes_pagamento',
  'Condições de Pagamento',
  'contrato',
  'contrato_condicoes_pagamento',
  NULL,
  'O COMPRADOR pagará: a) ENTRADA: R$ 50.000,00...',
  'texto',
  true,
  true
)
ON CONFLICT (chave) DO NOTHING;