
-- =====================================================================
-- Fix: Consolidar registros duplicados de COMPRADOR HISTÓRICO (PRÉ-SISTEMA)
-- =====================================================================

-- JD. IGUATEMI: reassociar negociações e contratos do duplicado para o mais antigo
UPDATE public.negociacoes
SET cliente_id = '37e13872-519b-4dce-b00a-7c375b573bde'
WHERE cliente_id = 'bf704830-1aa0-4025-9cf6-0c6edd62039f';

UPDATE public.contratos
SET cliente_id = '37e13872-519b-4dce-b00a-7c375b573bde'
WHERE cliente_id = 'bf704830-1aa0-4025-9cf6-0c6edd62039f';

DELETE FROM public.clientes 
WHERE id = 'bf704830-1aa0-4025-9cf6-0c6edd62039f';

-- BELVEDERE: reassociar negociações e contratos do duplicado para o mais antigo
UPDATE public.negociacoes
SET cliente_id = '1108a037-7aaa-4860-8ccb-740c757a5426'
WHERE cliente_id = '336b2481-bfe3-4aea-8530-d8fe7cd0c146';

UPDATE public.contratos
SET cliente_id = '1108a037-7aaa-4860-8ccb-740c757a5426'
WHERE cliente_id = '336b2481-bfe3-4aea-8530-d8fe7cd0c146';

DELETE FROM public.clientes 
WHERE id = '336b2481-bfe3-4aea-8530-d8fe7cd0c146';

-- Tornar o cliente histórico global (sem vínculo a empreendimento específico)
UPDATE public.clientes
SET empreendimento_id = NULL
WHERE nome = 'COMPRADOR HISTÓRICO (PRÉ-SISTEMA)';
