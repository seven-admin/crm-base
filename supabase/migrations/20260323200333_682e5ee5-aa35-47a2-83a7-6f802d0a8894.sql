
-- Create a helper function to get corretor IDs by user_id (avoids email join)
CREATE OR REPLACE FUNCTION public.get_corretor_ids_by_user(_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.corretores WHERE user_id = _user_id
$$;

-- =============================================
-- NEGOCIACOES
-- =============================================
DROP POLICY IF EXISTS "Corretores can view own negociacoes" ON negociacoes;
CREATE POLICY "Corretores can view own negociacoes"
ON negociacoes FOR SELECT TO authenticated
USING (corretor_id IN (SELECT public.get_corretor_ids_by_user(auth.uid())));

DROP POLICY IF EXISTS "Corretores can update own negociacoes" ON negociacoes;
CREATE POLICY "Corretores can update own negociacoes"
ON negociacoes FOR UPDATE TO authenticated
USING (corretor_id IN (SELECT public.get_corretor_ids_by_user(auth.uid())));

-- =============================================
-- NEGOCIACAO_UNIDADES
-- =============================================
DROP POLICY IF EXISTS "Users can view negociacao_unidades" ON negociacao_unidades;
CREATE POLICY "Users can view negociacao_unidades"
ON negociacao_unidades FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM negociacoes n
  WHERE n.id = negociacao_unidades.negociacao_id
    AND (is_admin(auth.uid()) OR has_role(auth.uid(), 'gestor_produto')
         OR n.corretor_id IN (SELECT public.get_corretor_ids_by_user(auth.uid())))
));

-- =============================================
-- NEGOCIACAO_CONDICOES_PAGAMENTO
-- =============================================
DROP POLICY IF EXISTS "Users can view negociacao_condicoes_pagamento" ON negociacao_condicoes_pagamento;
CREATE POLICY "Users can view negociacao_condicoes_pagamento"
ON negociacao_condicoes_pagamento FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM negociacoes n
  WHERE n.id = negociacao_condicoes_pagamento.negociacao_id
    AND (is_admin(auth.uid()) OR has_role(auth.uid(), 'gestor_produto')
         OR n.corretor_id IN (SELECT public.get_corretor_ids_by_user(auth.uid())))
));

-- =============================================
-- NEGOCIACAO_HISTORICO
-- =============================================
DROP POLICY IF EXISTS "Users can view negociacao_historico" ON negociacao_historico;
CREATE POLICY "Users can view negociacao_historico"
ON negociacao_historico FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM negociacoes n
  WHERE n.id = negociacao_historico.negociacao_id
    AND (is_admin(auth.uid()) OR has_role(auth.uid(), 'gestor_produto')
         OR n.corretor_id IN (SELECT public.get_corretor_ids_by_user(auth.uid())))
));

-- =============================================
-- NEGOCIACAO_CLIENTES
-- =============================================
DROP POLICY IF EXISTS "Users can view negociacao_clientes" ON negociacao_clientes;
CREATE POLICY "Users can view negociacao_clientes"
ON negociacao_clientes FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM negociacoes n
  WHERE n.id = negociacao_clientes.negociacao_id
    AND (is_admin(auth.uid()) OR has_role(auth.uid(), 'gestor_produto')
         OR n.corretor_id IN (SELECT public.get_corretor_ids_by_user(auth.uid())))
));

-- =============================================
-- CLIENTES
-- =============================================
DROP POLICY IF EXISTS "Corretores can view clientes" ON clientes;
CREATE POLICY "Corretores can view clientes"
ON clientes FOR SELECT TO authenticated
USING (corretor_id IN (SELECT public.get_corretor_ids_by_user(auth.uid())));

DROP POLICY IF EXISTS "Corretores can update own clientes" ON clientes;
CREATE POLICY "Corretores can update own clientes"
ON clientes FOR UPDATE TO authenticated
USING (corretor_id IN (SELECT public.get_corretor_ids_by_user(auth.uid())));

-- =============================================
-- ATIVIDADES
-- =============================================
DROP POLICY IF EXISTS "Users can view own atividades" ON atividades;
CREATE POLICY "Users can view own atividades"
ON atividades FOR SELECT TO authenticated
USING (gestor_id = auth.uid() OR corretor_id IN (SELECT public.get_corretor_ids_by_user(auth.uid())));

DROP POLICY IF EXISTS "Users can update own atividades" ON atividades;
CREATE POLICY "Users can update own atividades"
ON atividades FOR UPDATE TO authenticated
USING (gestor_id = auth.uid() OR corretor_id IN (SELECT public.get_corretor_ids_by_user(auth.uid())));

-- =============================================
-- COMISSOES
-- =============================================
DROP POLICY IF EXISTS "Corretores can view own comissoes" ON comissoes;
CREATE POLICY "Corretores can view own comissoes"
ON comissoes FOR SELECT TO authenticated
USING (corretor_id IN (SELECT public.get_corretor_ids_by_user(auth.uid())));

-- =============================================
-- CONTRATOS
-- =============================================
DROP POLICY IF EXISTS "Corretores can view own contratos" ON contratos;
CREATE POLICY "Corretores can view own contratos"
ON contratos FOR SELECT TO authenticated
USING (corretor_id IN (SELECT public.get_corretor_ids_by_user(auth.uid())));

-- =============================================
-- CONTRATO child tables
-- =============================================
DROP POLICY IF EXISTS "Users can view contrato_aprovacoes" ON contrato_aprovacoes;
CREATE POLICY "Users can view contrato_aprovacoes"
ON contrato_aprovacoes FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM contratos c
  WHERE c.id = contrato_aprovacoes.contrato_id
    AND (is_admin(auth.uid()) OR has_role(auth.uid(), 'gestor_produto')
         OR c.corretor_id IN (SELECT public.get_corretor_ids_by_user(auth.uid())))
));

DROP POLICY IF EXISTS "Users can view contrato_condicoes_pagamento" ON contrato_condicoes_pagamento;
CREATE POLICY "Users can view contrato_condicoes_pagamento"
ON contrato_condicoes_pagamento FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM contratos c
  WHERE c.id = contrato_condicoes_pagamento.contrato_id
    AND (is_admin(auth.uid()) OR has_role(auth.uid(), 'gestor_produto')
         OR c.corretor_id IN (SELECT public.get_corretor_ids_by_user(auth.uid())))
));

DROP POLICY IF EXISTS "Users can view contrato_documentos" ON contrato_documentos;
CREATE POLICY "Users can view contrato_documentos"
ON contrato_documentos FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM contratos c
  WHERE c.id = contrato_documentos.contrato_id
    AND (is_admin(auth.uid()) OR has_role(auth.uid(), 'gestor_produto')
         OR c.corretor_id IN (SELECT public.get_corretor_ids_by_user(auth.uid())))
));

DROP POLICY IF EXISTS "Users can view contrato_pendencias" ON contrato_pendencias;
CREATE POLICY "Users can view contrato_pendencias"
ON contrato_pendencias FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM contratos c
  WHERE c.id = contrato_pendencias.contrato_id
    AND (is_admin(auth.uid()) OR has_role(auth.uid(), 'gestor_produto')
         OR c.corretor_id IN (SELECT public.get_corretor_ids_by_user(auth.uid())))
));

DROP POLICY IF EXISTS "Users can view contrato_signatarios" ON contrato_signatarios;
CREATE POLICY "Users can view contrato_signatarios"
ON contrato_signatarios FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM contratos c
  WHERE c.id = contrato_signatarios.contrato_id
    AND (is_admin(auth.uid()) OR has_role(auth.uid(), 'gestor_produto')
         OR c.corretor_id IN (SELECT public.get_corretor_ids_by_user(auth.uid())))
));

DROP POLICY IF EXISTS "Authorized users can insert contrato_signatarios" ON contrato_signatarios;
CREATE POLICY "Authorized users can insert contrato_signatarios"
ON contrato_signatarios FOR INSERT TO authenticated
WITH CHECK (is_admin(auth.uid()) OR has_role(auth.uid(), 'gestor_produto')
  OR EXISTS (
    SELECT 1 FROM contratos c
    WHERE c.id = contrato_signatarios.contrato_id
      AND (c.created_by = auth.uid() OR c.gestor_id = auth.uid()
           OR c.corretor_id IN (SELECT public.get_corretor_ids_by_user(auth.uid())))
  ));

DROP POLICY IF EXISTS "Authorized users can update contrato_signatarios" ON contrato_signatarios;
CREATE POLICY "Authorized users can update contrato_signatarios"
ON contrato_signatarios FOR UPDATE TO authenticated
USING (is_admin(auth.uid()) OR has_role(auth.uid(), 'gestor_produto')
  OR EXISTS (
    SELECT 1 FROM contratos c
    WHERE c.id = contrato_signatarios.contrato_id
      AND (c.created_by = auth.uid() OR c.gestor_id = auth.uid()
           OR c.corretor_id IN (SELECT public.get_corretor_ids_by_user(auth.uid())))
  ))
WITH CHECK (is_admin(auth.uid()) OR has_role(auth.uid(), 'gestor_produto')
  OR EXISTS (
    SELECT 1 FROM contratos c
    WHERE c.id = contrato_signatarios.contrato_id
      AND (c.created_by = auth.uid() OR c.gestor_id = auth.uid()
           OR c.corretor_id IN (SELECT public.get_corretor_ids_by_user(auth.uid())))
  ));

DROP POLICY IF EXISTS "Users can view contrato_unidades" ON contrato_unidades;
CREATE POLICY "Users can view contrato_unidades"
ON contrato_unidades FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM contratos c
  WHERE c.id = contrato_unidades.contrato_id
    AND (is_admin(auth.uid()) OR has_role(auth.uid(), 'gestor_produto')
         OR c.corretor_id IN (SELECT public.get_corretor_ids_by_user(auth.uid())))
));

DROP POLICY IF EXISTS "Users can view contrato_versoes" ON contrato_versoes;
CREATE POLICY "Users can view contrato_versoes"
ON contrato_versoes FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM contratos c
  WHERE c.id = contrato_versoes.contrato_id
    AND (is_admin(auth.uid()) OR has_role(auth.uid(), 'gestor_produto')
         OR c.corretor_id IN (SELECT public.get_corretor_ids_by_user(auth.uid())))
));

-- =============================================
-- COMISSAO_PARCELAS
-- =============================================
DROP POLICY IF EXISTS "Users can view comissao_parcelas" ON comissao_parcelas;
CREATE POLICY "Users can view comissao_parcelas"
ON comissao_parcelas FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM comissoes c
  WHERE c.id = comissao_parcelas.comissao_id
    AND (is_admin(auth.uid()) OR has_role(auth.uid(), 'gestor_produto')
         OR c.corretor_id IN (SELECT public.get_corretor_ids_by_user(auth.uid())))
));

-- =============================================
-- CLIENTE_INTERACOES
-- =============================================
DROP POLICY IF EXISTS "Users can view cliente_interacoes" ON cliente_interacoes;
CREATE POLICY "Users can view cliente_interacoes"
ON cliente_interacoes FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM clientes c
  WHERE c.id = cliente_interacoes.cliente_id
    AND (is_admin(auth.uid()) OR has_role(auth.uid(), 'gestor_produto')
         OR c.corretor_id IN (SELECT public.get_corretor_ids_by_user(auth.uid())))
));
