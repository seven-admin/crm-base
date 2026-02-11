
-- =============================================
-- FIX 1: contrato_signatarios - restrict INSERT/UPDATE
-- =============================================

-- Drop overly permissive INSERT policy
DROP POLICY IF EXISTS "Users can insert contrato_signatarios" ON public.contrato_signatarios;

-- Drop overly permissive UPDATE policy  
DROP POLICY IF EXISTS "Users can update contrato_signatarios" ON public.contrato_signatarios;

-- Restrict INSERT to admins, gestores, and the corretor assigned to the contract
CREATE POLICY "Authorized users can insert contrato_signatarios"
ON public.contrato_signatarios FOR INSERT
WITH CHECK (
  is_admin(auth.uid()) OR
  has_role(auth.uid(), 'gestor_produto') OR
  EXISTS (
    SELECT 1 FROM contratos c
    WHERE c.id = contrato_signatarios.contrato_id
    AND (
      c.created_by = auth.uid() OR
      c.gestor_id = auth.uid() OR
      c.corretor_id IN (
        SELECT cor.id FROM corretores cor
        JOIN profiles p ON p.email = cor.email
        WHERE p.id = auth.uid()
      )
    )
  )
);

-- Restrict UPDATE to admins, gestores, and the corretor assigned to the contract
CREATE POLICY "Authorized users can update contrato_signatarios"
ON public.contrato_signatarios FOR UPDATE
USING (
  is_admin(auth.uid()) OR
  has_role(auth.uid(), 'gestor_produto') OR
  EXISTS (
    SELECT 1 FROM contratos c
    WHERE c.id = contrato_signatarios.contrato_id
    AND (
      c.created_by = auth.uid() OR
      c.gestor_id = auth.uid() OR
      c.corretor_id IN (
        SELECT cor.id FROM corretores cor
        JOIN profiles p ON p.email = cor.email
        WHERE p.id = auth.uid()
      )
    )
  )
)
WITH CHECK (
  is_admin(auth.uid()) OR
  has_role(auth.uid(), 'gestor_produto') OR
  EXISTS (
    SELECT 1 FROM contratos c
    WHERE c.id = contrato_signatarios.contrato_id
    AND (
      c.created_by = auth.uid() OR
      c.gestor_id = auth.uid() OR
      c.corretor_id IN (
        SELECT cor.id FROM corretores cor
        JOIN profiles p ON p.email = cor.email
        WHERE p.id = auth.uid()
      )
    )
  )
);

-- =============================================
-- FIX 2: boxes - restrict to empreendimento access
-- =============================================

-- Drop all permissive policies
DROP POLICY IF EXISTS "boxes_select_policy" ON public.boxes;
DROP POLICY IF EXISTS "boxes_insert_policy" ON public.boxes;
DROP POLICY IF EXISTS "boxes_update_policy" ON public.boxes;
DROP POLICY IF EXISTS "boxes_delete_policy" ON public.boxes;

-- SELECT: admins, gestores, or users with access to the empreendimento
CREATE POLICY "boxes_select_policy" ON public.boxes FOR SELECT
USING (
  is_admin(auth.uid()) OR
  has_role(auth.uid(), 'gestor_produto') OR
  user_has_empreendimento_access(auth.uid(), empreendimento_id)
);

-- INSERT: admins and gestores only
CREATE POLICY "boxes_insert_policy" ON public.boxes FOR INSERT
WITH CHECK (
  is_admin(auth.uid()) OR
  has_role(auth.uid(), 'gestor_produto')
);

-- UPDATE: admins and gestores only
CREATE POLICY "boxes_update_policy" ON public.boxes FOR UPDATE
USING (
  is_admin(auth.uid()) OR
  has_role(auth.uid(), 'gestor_produto')
)
WITH CHECK (
  is_admin(auth.uid()) OR
  has_role(auth.uid(), 'gestor_produto')
);

-- DELETE: admins only
CREATE POLICY "boxes_delete_policy" ON public.boxes FOR DELETE
USING (
  is_admin(auth.uid())
);
