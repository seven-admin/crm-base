
-- Remove permissões indevidas do gestor_produto: financeiro_fluxo, financeiro_dre, bonificacoes
DELETE FROM public.role_permissions
WHERE role_id = (SELECT id FROM public.roles WHERE name = 'gestor_produto')
  AND module_id IN (
    SELECT id FROM public.modules WHERE name IN ('financeiro_fluxo', 'financeiro_dre', 'bonificacoes')
  );
