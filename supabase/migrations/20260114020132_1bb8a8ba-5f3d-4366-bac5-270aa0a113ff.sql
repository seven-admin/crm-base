-- =============================================
-- CORREÇÃO: Políticas RLS para Gestor de Produto
-- Problema: Gestores estavam vendo TODOS os registros
-- Solução: Filtrar por gestor_id = auth.uid()
-- =============================================

-- =============================================
-- 1. TABELA CLIENTES
-- =============================================

-- Remover política antiga (muito permissiva)
DROP POLICY IF EXISTS "Gestores can manage clientes" ON public.clientes;

-- Gestor pode ver apenas seus próprios clientes
CREATE POLICY "Gestores can view own clientes"
  ON public.clientes FOR SELECT
  USING (
    has_role(auth.uid(), 'gestor_produto') 
    AND gestor_id = auth.uid()
  );

-- Gestor pode criar clientes (gestor_id será preenchido pelo frontend)
CREATE POLICY "Gestores can insert clientes"
  ON public.clientes FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'gestor_produto')
    AND gestor_id = auth.uid()
  );

-- Gestor pode atualizar apenas seus próprios clientes
CREATE POLICY "Gestores can update own clientes"
  ON public.clientes FOR UPDATE
  USING (
    has_role(auth.uid(), 'gestor_produto') 
    AND gestor_id = auth.uid()
  );

-- Gestor pode deletar apenas seus próprios clientes
CREATE POLICY "Gestores can delete own clientes"
  ON public.clientes FOR DELETE
  USING (
    has_role(auth.uid(), 'gestor_produto') 
    AND gestor_id = auth.uid()
  );

-- =============================================
-- 2. TABELA ATIVIDADES
-- =============================================

-- Remover política antiga
DROP POLICY IF EXISTS "Gestores can manage atividades" ON public.atividades;

-- Gestor pode ver apenas suas próprias atividades
CREATE POLICY "Gestores can view own atividades"
  ON public.atividades FOR SELECT
  USING (
    has_role(auth.uid(), 'gestor_produto') 
    AND gestor_id = auth.uid()
  );

-- Gestor pode criar atividades
CREATE POLICY "Gestores can insert atividades"
  ON public.atividades FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'gestor_produto')
    AND gestor_id = auth.uid()
  );

-- Gestor pode atualizar apenas suas próprias atividades
CREATE POLICY "Gestores can update own atividades"
  ON public.atividades FOR UPDATE
  USING (
    has_role(auth.uid(), 'gestor_produto') 
    AND gestor_id = auth.uid()
  );

-- Gestor pode deletar apenas suas próprias atividades
CREATE POLICY "Gestores can delete own atividades"
  ON public.atividades FOR DELETE
  USING (
    has_role(auth.uid(), 'gestor_produto') 
    AND gestor_id = auth.uid()
  );

-- =============================================
-- 3. TABELA COMISSOES
-- =============================================

-- Remover política antiga
DROP POLICY IF EXISTS "Gestores can manage comissoes" ON public.comissoes;

-- Gestor pode ver apenas suas próprias comissões
CREATE POLICY "Gestores can view own comissoes"
  ON public.comissoes FOR SELECT
  USING (
    has_role(auth.uid(), 'gestor_produto') 
    AND gestor_id = auth.uid()
  );

-- Gestor pode criar comissões
CREATE POLICY "Gestores can insert comissoes"
  ON public.comissoes FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'gestor_produto')
    AND gestor_id = auth.uid()
  );

-- Gestor pode atualizar apenas suas próprias comissões
CREATE POLICY "Gestores can update own comissoes"
  ON public.comissoes FOR UPDATE
  USING (
    has_role(auth.uid(), 'gestor_produto') 
    AND gestor_id = auth.uid()
  );

-- =============================================
-- 4. TABELA CONTRATOS
-- =============================================

-- Remover política antiga
DROP POLICY IF EXISTS "Gestores can manage contratos" ON public.contratos;

-- Gestor pode ver apenas seus próprios contratos
CREATE POLICY "Gestores can view own contratos"
  ON public.contratos FOR SELECT
  USING (
    has_role(auth.uid(), 'gestor_produto') 
    AND gestor_id = auth.uid()
  );

-- Gestor pode criar contratos
CREATE POLICY "Gestores can insert contratos"
  ON public.contratos FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'gestor_produto')
    AND gestor_id = auth.uid()
  );

-- Gestor pode atualizar apenas seus próprios contratos
CREATE POLICY "Gestores can update own contratos"
  ON public.contratos FOR UPDATE
  USING (
    has_role(auth.uid(), 'gestor_produto') 
    AND gestor_id = auth.uid()
  );