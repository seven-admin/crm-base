
CREATE OR REPLACE FUNCTION public.user_has_empreendimento_access(_user_id uuid, _empreendimento_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT 
    public.is_admin(_user_id) 
    OR public.has_role(_user_id, 'gestor_produto')
    OR public.is_seven_team(_user_id)
    OR public.has_role(_user_id, 'corretor')
    OR public.is_gestor_imobiliaria(_user_id)
    OR EXISTS (SELECT 1 FROM public.sistema_user_empreendimentos WHERE user_id = _user_id AND empreendimento_id = _empreendimento_id)
    OR EXISTS (SELECT 1 FROM public.seven_corretores c JOIN public.seven_empreendimento_imobiliarias ei ON ei.imobiliaria_id = c.imobiliaria_id WHERE c.user_id = _user_id AND ei.empreendimento_id = _empreendimento_id)
    OR EXISTS (SELECT 1 FROM public.seven_imobiliarias i JOIN public.seven_empreendimento_imobiliarias ei ON ei.imobiliaria_id = i.id WHERE i.user_id = _user_id AND ei.empreendimento_id = _empreendimento_id)
$$;

CREATE OR REPLACE FUNCTION public.can_access_empreendimento(_user_id uuid, _empreendimento_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT public.is_admin(_user_id)
    OR EXISTS (SELECT 1 FROM public.sistema_user_empreendimentos WHERE user_id = _user_id AND empreendimento_id = _empreendimento_id)
$$;

CREATE OR REPLACE FUNCTION public.can_access_module(_user_id uuid, _module_name text, _action text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.sistema_role_permissions rp
    JOIN public.sistema_modules m ON m.id = rp.module_id
    JOIN public.user_roles ur ON ur.role = rp.role
    WHERE ur.user_id = _user_id AND m.name = _module_name AND m.is_active = true
      AND ((_action = 'view' AND rp.can_view) OR (_action = 'create' AND rp.can_create) OR (_action = 'edit' AND rp.can_edit) OR (_action = 'delete' AND rp.can_delete))
  )
$$;

CREATE OR REPLACE FUNCTION public.can_access_module_v2(_user_id uuid, _module_name text, _action text)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE _custom_perm RECORD; _role_perm RECORD;
BEGIN
  IF public.is_admin(_user_id) THEN RETURN true; END IF;
  SELECT ump.can_view, ump.can_create, ump.can_edit, ump.can_delete INTO _custom_perm
  FROM public.sistema_user_module_permissions ump
  JOIN public.sistema_modules m ON m.id = ump.module_id
  WHERE ump.user_id = _user_id AND m.name = _module_name AND m.is_active = true;
  IF FOUND THEN
    RETURN CASE _action WHEN 'view' THEN _custom_perm.can_view WHEN 'create' THEN _custom_perm.can_create WHEN 'edit' THEN _custom_perm.can_edit WHEN 'delete' THEN _custom_perm.can_delete ELSE false END;
  END IF;
  SELECT rp.can_view, rp.can_create, rp.can_edit, rp.can_delete INTO _role_perm
  FROM public.sistema_role_permissions rp
  JOIN public.sistema_modules m ON m.id = rp.module_id
  JOIN public.user_roles ur ON ur.role = rp.role
  WHERE ur.user_id = _user_id AND m.name = _module_name AND m.is_active = true;
  IF FOUND THEN
    RETURN CASE _action WHEN 'view' THEN _role_perm.can_view WHEN 'create' THEN _role_perm.can_create WHEN 'edit' THEN _role_perm.can_edit WHEN 'delete' THEN _role_perm.can_delete ELSE false END;
  END IF;
  RETURN false;
END; $$;

CREATE OR REPLACE FUNCTION public.get_user_module_permission(_user_id uuid, _module_name text)
RETURNS TABLE(can_view boolean, can_create boolean, can_edit boolean, can_delete boolean, scope text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT ump.can_view, ump.can_create, ump.can_edit, ump.can_delete, ump.scope
  FROM public.sistema_user_module_permissions ump
  JOIN public.sistema_modules m ON m.id = ump.module_id
  WHERE ump.user_id = _user_id AND m.name = _module_name LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.get_module_scope(_user_id uuid, _module_name text)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT rp.scope FROM public.sistema_role_permissions rp
  JOIN public.sistema_modules m ON m.id = rp.module_id
  JOIN public.user_roles ur ON ur.role = rp.role
  WHERE ur.user_id = _user_id AND m.name = _module_name LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.get_gestor_empreendimento(emp_id uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT ue.user_id FROM public.sistema_user_empreendimentos ue
  INNER JOIN public.user_roles ur ON ue.user_id = ur.user_id
  INNER JOIN public.roles r ON ur.role_id = r.id
  WHERE ue.empreendimento_id = emp_id AND r.name = 'gestor_produto' AND r.is_active = true LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_user_imobiliaria_id(_user_id uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT id FROM public.seven_imobiliarias WHERE user_id = _user_id LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.get_imobiliarias_ativas()
RETURNS TABLE(id uuid, nome text, endereco_cidade text, endereco_uf text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT i.id, i.nome, i.endereco_cidade, i.endereco_uf FROM public.seven_imobiliarias i WHERE i.is_active = true ORDER BY i.nome;
$$;

CREATE OR REPLACE FUNCTION public.get_corretor_ids_by_user(_user_id uuid)
RETURNS SETOF uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT id FROM public.seven_corretores WHERE user_id = _user_id
$$;

CREATE OR REPLACE FUNCTION public.get_cidades_corretores()
RETURNS TABLE(cidade text) LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT DISTINCT cidade FROM (
    SELECT TRIM(c.cidade) as cidade FROM public.seven_corretores c WHERE c.cidade IS NOT NULL AND TRIM(c.cidade) <> ''
    UNION
    SELECT TRIM(i.endereco_cidade) as cidade FROM public.seven_corretores c
    JOIN public.seven_imobiliarias i ON i.id = c.imobiliaria_id
    WHERE (c.cidade IS NULL OR TRIM(c.cidade) = '') AND i.endereco_cidade IS NOT NULL AND TRIM(i.endereco_cidade) <> ''
  ) sub ORDER BY cidade;
$$;

CREATE OR REPLACE FUNCTION public.get_or_create_pessoa(p_nome text, p_cpf text DEFAULT NULL, p_telefone text DEFAULT NULL, p_email text DEFAULT NULL, p_origem text DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_id uuid;
BEGIN
  IF p_cpf IS NOT NULL AND btrim(p_cpf) <> '' THEN
    SELECT id INTO v_id FROM public.seven_clientes WHERE cpf = p_cpf LIMIT 1;
    IF v_id IS NOT NULL THEN RETURN v_id; END IF;
  END IF;
  IF p_telefone IS NOT NULL AND btrim(p_telefone) <> '' THEN
    SELECT id INTO v_id FROM public.seven_clientes WHERE telefone = p_telefone OR whatsapp = p_telefone LIMIT 1;
    IF v_id IS NOT NULL THEN RETURN v_id; END IF;
  END IF;
  IF p_email IS NOT NULL AND btrim(p_email) <> '' THEN
    SELECT id INTO v_id FROM public.seven_clientes WHERE lower(email) = lower(p_email) LIMIT 1;
    IF v_id IS NOT NULL THEN RETURN v_id; END IF;
  END IF;
  INSERT INTO public.seven_clientes (nome, cpf, telefone, whatsapp, email, origem, nivel_cadastro)
  VALUES (COALESCE(NULLIF(btrim(p_nome),''),'LEAD SEM NOME'), NULLIF(btrim(p_cpf),''), NULLIF(btrim(p_telefone),''), NULLIF(btrim(p_telefone),''), NULLIF(btrim(p_email),''), p_origem, 'lead')
  RETURNING id INTO v_id;
  RETURN v_id;
END; $$;

CREATE OR REPLACE FUNCTION public.get_unidades_disponiveis(p_incorporadora_id uuid DEFAULT NULL, p_empreendimento_id uuid DEFAULT NULL, p_status text[] DEFAULT NULL)
RETURNS TABLE(empreendimento_id uuid, empreendimento text, incorporadora text, bloco text, andar integer, unidade text, tipologia text, quartos integer, suites integer, vagas integer, area_privativa numeric, valor numeric, status text, unidade_id uuid)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT e.id, e.nome, i.nome, b.nome, u.andar, u.numero, t.nome, t.quartos, t.suites, t.vagas, u.area_privativa, u.valor, u.status::text, u.id
  FROM public.seven_unidades u
  JOIN public.seven_empreendimentos e ON e.id = u.empreendimento_id
  LEFT JOIN public.seven_incorporadoras i ON i.id = e.incorporadora_id
  LEFT JOIN public.seven_blocos b ON b.id = u.bloco_id
  LEFT JOIN public.seven_tipologias t ON t.id = u.tipologia_id
  WHERE e.is_active = true AND u.is_active = true
    AND (p_status IS NULL OR u.status::text = ANY(p_status))
    AND (p_incorporadora_id IS NULL OR e.incorporadora_id = p_incorporadora_id)
    AND (p_empreendimento_id IS NULL OR e.id = p_empreendimento_id)
  ORDER BY e.nome, b.nome, u.andar, u.numero;
$$;

CREATE OR REPLACE FUNCTION public.ensure_single_principal_telefone()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NEW.principal = true THEN
    UPDATE public.seven_cliente_telefones SET principal = false WHERE cliente_id = NEW.cliente_id AND id != NEW.id AND principal = true;
  END IF;
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.generate_cod_sorteio()
RETURNS text LANGUAGE plpgsql AS $$
DECLARE chars text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'; digits text := '0123456789'; result text; attempts int := 0;
BEGIN
  LOOP
    result := substr(digits, floor(random()*10+1)::int, 1) || substr(digits, floor(random()*10+1)::int, 1) || substr(digits, floor(random()*10+1)::int, 1) || substr(digits, floor(random()*10+1)::int, 1) || '-' ||
              substr(chars, floor(random()*26+1)::int, 1) || substr(digits, floor(random()*10+1)::int, 1) || substr(chars, floor(random()*26+1)::int, 1) || substr(digits, floor(random()*10+1)::int, 1) || '-' ||
              substr(chars, floor(random()*26+1)::int, 1) || substr(chars, floor(random()*26+1)::int, 1) || substr(chars, floor(random()*26+1)::int, 1) || substr(chars, floor(random()*26+1)::int, 1);
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.seven_corretores WHERE cod_sorteio = result);
    attempts := attempts + 1;
    IF attempts > 100 THEN RAISE EXCEPTION 'Não foi possível gerar código único'; END IF;
  END LOOP;
  RETURN result;
END; $$;

CREATE OR REPLACE FUNCTION public.audit_trigger_func()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE _user_email text;
BEGIN
  SELECT email INTO _user_email FROM auth.users WHERE id = auth.uid();
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.sistema_audit_logs (user_id, user_email, action, table_name, record_id, new_data)
    VALUES (auth.uid(), _user_email, 'create', TG_TABLE_NAME, NEW.id, to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.sistema_audit_logs (user_id, user_email, action, table_name, record_id, old_data, new_data)
    VALUES (auth.uid(), _user_email, 'update', TG_TABLE_NAME, NEW.id, to_jsonb(OLD), to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.sistema_audit_logs (user_id, user_email, action, table_name, record_id, old_data)
    VALUES (auth.uid(), _user_email, 'delete', TG_TABLE_NAME, OLD.id, to_jsonb(OLD));
    RETURN OLD;
  END IF;
END; $$;
