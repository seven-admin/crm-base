-- Adicionar policy de UPDATE para proposta_condicoes_pagamento
CREATE POLICY "Usuarios autenticados podem atualizar condicoes da proposta"
  ON proposta_condicoes_pagamento FOR UPDATE
  TO authenticated
  USING (true);

-- Adicionar policy de DELETE para proposta_condicoes_pagamento
CREATE POLICY "Usuarios autenticados podem deletar condicoes da proposta"
  ON proposta_condicoes_pagamento FOR DELETE
  TO authenticated
  USING (true);