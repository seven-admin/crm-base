
-- Ajustar permissões do gestor_produto
-- Primeiro, buscar o role_id do gestor_produto
DO $$
DECLARE
  v_role_id uuid;
BEGIN
  SELECT id INTO v_role_id FROM public.roles WHERE name = 'gestor_produto';
  
  IF v_role_id IS NULL THEN
    RAISE EXCEPTION 'Role gestor_produto não encontrado';
  END IF;

  -- Remover permissões que não devem existir
  DELETE FROM public.role_permissions
  WHERE role_id = v_role_id
    AND module_id IN (
      SELECT id FROM public.modules WHERE name IN (
        'agenda', 'config_negociacoes', 'contratos_tipos_parcela',
        'negociacoes', 'reservas', 'solicitacoes', 'unidades', 'usuarios'
      )
    );

  -- Adicionar permissões que faltam (usando ON CONFLICT para segurança)
  -- forecast
  INSERT INTO public.role_permissions (role_id, module_id, can_view, can_create, can_edit, can_delete, scope)
  SELECT v_role_id, id, true, true, true, false, 'empreendimento'
  FROM public.modules WHERE name = 'forecast'
  ON CONFLICT (role_id, module_id) DO UPDATE SET can_view = true, can_create = true, can_edit = true;

  -- financeiro_fluxo
  INSERT INTO public.role_permissions (role_id, module_id, can_view, can_create, can_edit, can_delete, scope)
  SELECT v_role_id, id, true, false, false, false, 'empreendimento'
  FROM public.modules WHERE name = 'financeiro_fluxo'
  ON CONFLICT (role_id, module_id) DO UPDATE SET can_view = true;

  -- financeiro_dre
  INSERT INTO public.role_permissions (role_id, module_id, can_view, can_create, can_edit, can_delete, scope)
  SELECT v_role_id, id, true, false, false, false, 'empreendimento'
  FROM public.modules WHERE name = 'financeiro_dre'
  ON CONFLICT (role_id, module_id) DO UPDATE SET can_view = true;

  -- bonificacoes
  INSERT INTO public.role_permissions (role_id, module_id, can_view, can_create, can_edit, can_delete, scope)
  SELECT v_role_id, id, true, false, false, false, 'empreendimento'
  FROM public.modules WHERE name = 'bonificacoes'
  ON CONFLICT (role_id, module_id) DO UPDATE SET can_view = true;

  -- incorporadoras
  INSERT INTO public.role_permissions (role_id, module_id, can_view, can_create, can_edit, can_delete, scope)
  SELECT v_role_id, id, true, false, false, false, 'empreendimento'
  FROM public.modules WHERE name = 'incorporadoras'
  ON CONFLICT (role_id, module_id) DO UPDATE SET can_view = true;
END $$;
