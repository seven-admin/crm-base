-- Parte 1: Atualizar tabela comissoes para usar gestor_id
-- Adicionar novos campos simplificados
ALTER TABLE comissoes 
  ADD COLUMN IF NOT EXISTS percentual_comissao numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS valor_comissao numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS status comissao_status DEFAULT 'pendente',
  ADD COLUMN IF NOT EXISTS data_pagamento date,
  ADD COLUMN IF NOT EXISTS nf_numero text;

-- Migrar dados existentes (corretor -> gestor, usar valores do corretor como base)
UPDATE comissoes SET 
  percentual_comissao = COALESCE(percentual_corretor, 0),
  valor_comissao = COALESCE(valor_corretor, 0),
  status = status_corretor,
  data_pagamento = data_pagamento_corretor,
  nf_numero = nf_corretor
WHERE percentual_comissao = 0;

-- Parte 2: Adicionar campo corretagem_texto na tabela contratos
ALTER TABLE contratos
  ADD COLUMN IF NOT EXISTS corretagem_texto text;