-- =====================================================================
-- BASELINE SCHEMA DUMP (snapshot completo do banco)
-- Projeto Supabase: pizerpoxuqopekmbvohh
-- Gerado em: 2026-06-19
--
-- Este arquivo é um snapshot do estado atual do banco e foi escrito de
-- forma idempotente (IF NOT EXISTS / OR REPLACE / DO blocks) para poder
-- ser reaplicado em um banco vazio (recriar do zero) ou no próprio banco
-- atual sem causar erros.
--
-- Conteúdo:
--   1) Extensões e schemas pré-requisitos
--   2) Tipos enumerados (public)
--   3) Sequences
--   4) Funções (security definer / triggers helpers)
--   5) Tabelas (public)
--   6) Constraints (PK, UK, CHECK, FK)
--   7) Índices
--   8) Triggers
--   9) RLS habilitada
--  10) Policies RLS
--  11) Grants para anon / authenticated / service_role
--  12) Buckets de Storage
-- =====================================================================

-- 1) Extensões -----------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2) Enums --------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'gestor_produto', 'incorporador', 'corretor', 'cliente_externo', 'supervisor_relacionamento', 'supervisor_render', 'supervisor_criacao', 'supervisor_video', 'equipe_marketing', 'super_admin', 'diretor_de_marketing');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE public.aprovacao_status AS ENUM ('pendente', 'aprovado', 'reprovado', 'em_revisao');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE public.aprovador_tipo AS ENUM ('corretor', 'gestor_comercial', 'juridico', 'diretoria', 'incorporador');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE public.briefing_status AS ENUM ('pendente', 'triado', 'em_producao', 'revisao', 'aprovado', 'entregue', 'cancelado');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE public.categoria_projeto AS ENUM ('render_3d', 'design_grafico', 'video_animacao', 'evento', 'pedido_orcamento', 'criacao_campanha');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE public.comissao_status AS ENUM ('pendente', 'parcialmente_pago', 'pago', 'cancelado');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE public.contrato_status AS ENUM ('em_geracao', 'enviado_assinatura', 'assinado', 'enviado_incorporador', 'aprovado', 'reprovado', 'cancelado');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE public.documento_contrato_status AS ENUM ('pendente', 'enviado', 'aprovado', 'reprovado');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE public.documento_tipo AS ENUM ('registro_incorporacao', 'matricula', 'projeto', 'licenca', 'contrato', 'memorial', 'outro');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE public.empreendimento_status AS ENUM ('lancamento', 'obra', 'entregue');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE public.empreendimento_tipo AS ENUM ('loteamento', 'condominio', 'predio', 'comercial');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE public.etapa_funil AS ENUM ('lead', 'atendimento', 'proposta', 'negociacao', 'fechado', 'perdido');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE public.lead_temperatura AS ENUM ('frio', 'morno', 'quente');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE public.midia_tipo AS ENUM ('imagem', 'video', 'tour_virtual', 'pdf', 'link');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE public.parcela_status AS ENUM ('pendente', 'paga', 'atrasada', 'cancelada');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE public.pendencia_status AS ENUM ('aberta', 'resolvida', 'cancelada');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE public.prioridade_projeto AS ENUM ('baixa', 'media', 'alta', 'urgente');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE public.proposta_status AS ENUM ('rascunho', 'enviada', 'aceita', 'recusada', 'expirada', 'convertida');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE public.reserva_status AS ENUM ('ativa', 'expirada', 'convertida', 'cancelada');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE public.signatario_status AS ENUM ('pendente', 'enviado', 'visualizado', 'assinado', 'recusado');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE public.signatario_tipo AS ENUM ('comprador', 'conjuge', 'testemunha_1', 'testemunha_2', 'representante_legal', 'incorporador');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE public.status_projeto AS ENUM ('briefing', 'triagem', 'em_producao', 'revisao', 'aprovacao_cliente', 'concluido', 'arquivado');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE public.tipologia_categoria AS ENUM ('casa', 'apartamento', 'terreno');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE public.unidade_status AS ENUM ('disponivel', 'reservada', 'vendida', 'bloqueada', 'negociacao', 'contrato');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3) Sequences ----------------------------------------------------------
CREATE SEQUENCE IF NOT EXISTS public.briefing_codigo_seq;
CREATE SEQUENCE IF NOT EXISTS public.comissao_numero_seq;
CREATE SEQUENCE IF NOT EXISTS public.contrato_numero_seq;
CREATE SEQUENCE IF NOT EXISTS public.evento_codigo_seq;
CREATE SEQUENCE IF NOT EXISTS public.negociacao_codigo_seq;
CREATE SEQUENCE IF NOT EXISTS public.negociacao_proposta_seq;
CREATE SEQUENCE IF NOT EXISTS public.projeto_codigo_seq;
CREATE SEQUENCE IF NOT EXISTS public.proposta_numero_seq;
CREATE SEQUENCE IF NOT EXISTS public.reserva_protocolo_seq;

-- 4) Funções ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.validate_conjuge_data()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.tem_conjuge = true AND (
    NEW.conjuge_nome IS NULL OR 
    NEW.conjuge_cpf IS NULL
  ) THEN
    RAISE EXCEPTION 'Dados do cônjuge são obrigatórios quando tem_conjuge é true';
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.aprovar_solicitacao_negociacao(p_negociacao_id uuid, p_gestor_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_unidades_indisponiveis TEXT[];
  v_negociacoes_conflitantes UUID[];
  v_unidade_ids UUID[];
  v_qtd_conflitantes INTEGER;
BEGIN
  -- 1. Buscar unidades da negociação
  SELECT array_agg(unidade_id) INTO v_unidade_ids
  FROM public.negociacao_unidades
  WHERE negociacao_id = p_negociacao_id;

  IF v_unidade_ids IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Nenhuma unidade vinculada a esta negociação'
    );
  END IF;

  -- 2. Validar se todas estão disponíveis
  SELECT array_agg(u.codigo) INTO v_unidades_indisponiveis
  FROM public.unidades u
  WHERE u.id = ANY(v_unidade_ids) AND u.status != 'disponivel';

  IF array_length(v_unidades_indisponiveis, 1) > 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Unidades indisponíveis: ' || array_to_string(v_unidades_indisponiveis, ', ')
    );
  END IF;

  -- 3. Reservar unidades
  UPDATE public.unidades 
  SET status = 'reservada'::unidade_status 
  WHERE id = ANY(v_unidade_ids);

  -- 4. Identificar negociações conflitantes (outras pendentes com mesmas unidades)
  SELECT array_agg(DISTINCT n.id) INTO v_negociacoes_conflitantes
  FROM public.negociacoes n
  JOIN public.negociacao_unidades nu ON nu.negociacao_id = n.id
  WHERE nu.unidade_id = ANY(v_unidade_ids)
    AND n.id != p_negociacao_id
    AND n.status_aprovacao = 'pendente';

  v_qtd_conflitantes := COALESCE(array_length(v_negociacoes_conflitantes, 1), 0);

  -- 5. Rejeitar automaticamente as conflitantes
  IF v_qtd_conflitantes > 0 THEN
    UPDATE public.negociacoes 
    SET status_aprovacao = 'rejeitada',
        rejeitada_em = NOW(),
        motivo_rejeicao = 'Unidade reservada em outra negociação (aprovação automática)',
        updated_by = p_gestor_id
    WHERE id = ANY(v_negociacoes_conflitantes);
  END IF;

  -- 6. Aprovar negociação atual
  UPDATE public.negociacoes 
  SET status_aprovacao = 'aprovada',
      aprovada_em = NOW(),
      updated_by = p_gestor_id
  WHERE id = p_negociacao_id;

  RETURN jsonb_build_object(
    'success', true,
    'conflitantes_rejeitadas', v_qtd_conflitantes,
    'unidades_reservadas', array_length(v_unidade_ids, 1)
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.ensure_single_principal_telefone()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.principal = true THEN
    UPDATE public.cliente_telefones 
    SET principal = false 
    WHERE cliente_id = NEW.cliente_id 
      AND id != NEW.id 
      AND principal = true;
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.gerar_hash_versao(conteudo text)
 RETURNS text
 LANGUAGE plpgsql
 IMMUTABLE
AS $function$
BEGIN
  RETURN md5(COALESCE(conteudo, ''));
END;
$function$
;

CREATE OR REPLACE FUNCTION public.set_atividade_created_by()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.created_by IS NULL THEN
    NEW.created_by := auth.uid();
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.auto_set_gestor_id_atividades()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.gestor_id IS NULL AND public.has_role(auth.uid(), 'gestor_produto') THEN
    NEW.gestor_id := auth.uid();
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_gestor_empreendimento(emp_id uuid)
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT ue.user_id
  FROM public.user_empreendimentos ue
  INNER JOIN public.user_roles ur ON ue.user_id = ur.user_id
  INNER JOIN public.roles r ON ur.role_id = r.id
  WHERE ue.empreendimento_id = emp_id
    AND r.name = 'gestor_produto'
    AND r.is_active = true
  LIMIT 1;
$function$
;

CREATE OR REPLACE FUNCTION public.rejeitar_solicitacao_negociacao(p_negociacao_id uuid, p_motivo text, p_gestor_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.negociacoes 
  SET status_aprovacao = 'rejeitada',
      rejeitada_em = NOW(),
      motivo_rejeicao = p_motivo,
      updated_by = p_gestor_id
  WHERE id = p_negociacao_id
    AND status_aprovacao = 'pendente';
  
  RETURN FOUND;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.liberar_unidades_negociacao_cancelada()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Se negociação estava aprovada e agora foi rejeitada/cancelada
  IF OLD.status_aprovacao = 'aprovada' AND NEW.status_aprovacao = 'rejeitada' THEN
    UPDATE public.unidades 
    SET status = 'disponivel'::unidade_status
    WHERE id IN (
      SELECT unidade_id FROM public.negociacao_unidades 
      WHERE negociacao_id = NEW.id
    );
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = _user_id
      AND (
        ur.role::text = _role
        OR EXISTS (
          SELECT 1 FROM public.roles r
          WHERE r.id = ur.role_id AND r.name = _role AND r.is_active = true
        )
      )
  )
$function$
;

CREATE OR REPLACE FUNCTION public.generate_briefing_codigo()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.codigo := 'BRF-' || LPAD(nextval('briefing_codigo_seq')::TEXT, 5, '0');
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.auto_set_gestor_id_clientes()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Se gestor_id não foi informado e o usuário é gestor_produto, preencher automaticamente
  IF NEW.gestor_id IS NULL AND public.has_role(auth.uid(), 'gestor_produto') THEN
    NEW.gestor_id := auth.uid();
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.log_atividade_criacao()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.atividade_historico (atividade_id, user_id, tipo_evento, valor_novo)
  VALUES (NEW.id, auth.uid(), 'criacao', NEW.titulo);
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.is_incorporador(_user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 
    FROM public.user_roles ur
    JOIN public.roles r ON r.id = ur.role_id
    WHERE ur.user_id = _user_id
    AND r.name = 'incorporador'
    AND r.is_active = true
  )
$function$
;

CREATE OR REPLACE FUNCTION public.get_imobiliarias_ativas()
 RETURNS TABLE(id uuid, nome text, endereco_cidade text, endereco_uf text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT i.id, i.nome, i.endereco_cidade, i.endereco_uf
  FROM public.imobiliarias i
  WHERE i.is_active = true
  ORDER BY i.nome;
$function$
;

CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT public.has_role(_user_id, 'admin') 
      OR public.has_role(_user_id, 'super_admin')
$function$
;

CREATE OR REPLACE FUNCTION public.get_corretor_ids_by_user(_user_id uuid)
 RETURNS SETOF uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT id FROM public.corretores WHERE user_id = _user_id
$function$
;

CREATE OR REPLACE FUNCTION public.sync_user_role_enum()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_role_name text;
BEGIN
  IF NEW.role IS NULL AND NEW.role_id IS NOT NULL THEN
    SELECT name INTO v_role_name FROM public.roles WHERE id = NEW.role_id AND is_active = true;
    BEGIN
      NEW.role := v_role_name::app_role;
    EXCEPTION WHEN invalid_text_representation THEN
      -- role_name não existe no enum (ex: gestor_produto), mantém NULL
      NULL;
    END;
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  insert into public.profiles (id, full_name, email, is_active)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    new.email,
    false  -- Novos usuários ficam inativos até ativação por admin
  );
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.uppercase_clientes()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.email IS NOT NULL THEN NEW.email = LOWER(NEW.email); END IF;
  IF NEW.nome IS NOT NULL THEN NEW.nome = UPPER(NEW.nome); END IF;
  IF NEW.razao_social IS NOT NULL THEN NEW.razao_social = UPPER(NEW.razao_social); END IF;
  IF NEW.endereco_logradouro IS NOT NULL THEN NEW.endereco_logradouro = UPPER(NEW.endereco_logradouro); END IF;
  IF NEW.endereco_bairro IS NOT NULL THEN NEW.endereco_bairro = UPPER(NEW.endereco_bairro); END IF;
  IF NEW.endereco_cidade IS NOT NULL THEN NEW.endereco_cidade = UPPER(NEW.endereco_cidade); END IF;
  IF NEW.endereco_complemento IS NOT NULL THEN NEW.endereco_complemento = UPPER(NEW.endereco_complemento); END IF;
  IF NEW.endereco_uf IS NOT NULL THEN NEW.endereco_uf = UPPER(NEW.endereco_uf); END IF;
  IF NEW.nome_mae IS NOT NULL THEN NEW.nome_mae = UPPER(NEW.nome_mae); END IF;
  IF NEW.nome_pai IS NOT NULL THEN NEW.nome_pai = UPPER(NEW.nome_pai); END IF;
  IF NEW.profissao IS NOT NULL THEN NEW.profissao = UPPER(NEW.profissao); END IF;
  IF NEW.nacionalidade IS NOT NULL THEN NEW.nacionalidade = UPPER(NEW.nacionalidade); END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.atualizar_ficha_completa()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.ficha_completa := public.verificar_ficha_proposta_completa(NEW.id);
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.can_view_negociacao_condicoes(_neg_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM negociacoes n
    WHERE n.id = _neg_id
    AND (
      is_admin(auth.uid())
      OR has_role(auth.uid(), 'gestor_produto')
      OR is_seven_team(auth.uid())
      OR n.corretor_id IN (SELECT get_corretor_ids_by_user(auth.uid()))
      OR (is_incorporador(auth.uid()) 
          AND user_has_empreendimento_access(auth.uid(), n.empreendimento_id))
    )
  )
$function$
;

CREATE OR REPLACE FUNCTION public.set_data_venda()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.status = 'vendida' AND (OLD.status IS DISTINCT FROM 'vendida') THEN
    NEW.data_venda = now();
  ELSIF NEW.status != 'vendida' THEN
    NEW.data_venda = NULL;
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.log_planejamento_changes()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Log mudança de status
  IF OLD.status_id IS DISTINCT FROM NEW.status_id THEN
    INSERT INTO public.planejamento_historico (item_id, user_id, campo_alterado, valor_anterior, valor_novo)
    VALUES (NEW.id, auth.uid(), 'status_id', OLD.status_id::text, NEW.status_id::text);
  END IF;
  
  -- Log mudança de data_inicio
  IF OLD.data_inicio IS DISTINCT FROM NEW.data_inicio THEN
    INSERT INTO public.planejamento_historico (item_id, user_id, campo_alterado, valor_anterior, valor_novo)
    VALUES (NEW.id, auth.uid(), 'data_inicio', OLD.data_inicio::text, NEW.data_inicio::text);
  END IF;
  
  -- Log mudança de data_fim
  IF OLD.data_fim IS DISTINCT FROM NEW.data_fim THEN
    INSERT INTO public.planejamento_historico (item_id, user_id, campo_alterado, valor_anterior, valor_novo)
    VALUES (NEW.id, auth.uid(), 'data_fim', OLD.data_fim::text, NEW.data_fim::text);
  END IF;
  
  -- Log mudança de responsável
  IF OLD.responsavel_tecnico_id IS DISTINCT FROM NEW.responsavel_tecnico_id THEN
    INSERT INTO public.planejamento_historico (item_id, user_id, campo_alterado, valor_anterior, valor_novo)
    VALUES (NEW.id, auth.uid(), 'responsavel_tecnico_id', OLD.responsavel_tecnico_id::text, NEW.responsavel_tecnico_id::text);
  END IF;
  
  NEW.updated_at := now();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_imobiliaria_id(_user_id uuid)
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  -- Primeiro verifica se é gestor de imobiliária
  SELECT id FROM public.imobiliarias WHERE user_id = _user_id LIMIT 1
$function$
;

CREATE OR REPLACE FUNCTION public.is_gestor_imobiliaria(_user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 
    FROM public.user_roles ur
    JOIN public.roles r ON r.id = ur.role_id
    WHERE ur.user_id = _user_id
    AND r.name = 'gestor_imobiliaria'
    AND r.is_active = true
  )
$function$
;

CREATE OR REPLACE FUNCTION public.is_seven_team(_user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.roles r ON r.id = ur.role_id
    WHERE ur.user_id = _user_id
      AND r.name NOT IN ('incorporador', 'corretor', 'cliente_externo', 'gestor_imobiliaria')
      AND r.is_active = true
  )
$function$
;

CREATE OR REPLACE FUNCTION public.log_atividade_alteracao()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_tipo_evento text;
BEGIN
  -- Status
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    v_tipo_evento := CASE NEW.status
      WHEN 'concluida' THEN 'concluida'
      WHEN 'cancelada' THEN 'cancelada'
      ELSE CASE WHEN OLD.status IN ('concluida','cancelada') AND NEW.status = 'pendente' THEN 'reaberta' ELSE 'status_alterado' END
    END;
    INSERT INTO public.atividade_historico (atividade_id, user_id, tipo_evento, campo_alterado, valor_anterior, valor_novo)
    VALUES (NEW.id, v_user_id, v_tipo_evento, 'status', OLD.status, NEW.status);
  END IF;

  -- Temperatura
  IF OLD.temperatura_cliente IS DISTINCT FROM NEW.temperatura_cliente THEN
    INSERT INTO public.atividade_historico (atividade_id, user_id, tipo_evento, campo_alterado, valor_anterior, valor_novo)
    VALUES (NEW.id, v_user_id, 'temperatura_alterada', 'temperatura_cliente', OLD.temperatura_cliente, NEW.temperatura_cliente);
  END IF;

  -- Titulo
  IF OLD.titulo IS DISTINCT FROM NEW.titulo THEN
    INSERT INTO public.atividade_historico (atividade_id, user_id, tipo_evento, campo_alterado, valor_anterior, valor_novo)
    VALUES (NEW.id, v_user_id, 'edicao', 'titulo', OLD.titulo, NEW.titulo);
  END IF;

  -- Tipo
  IF OLD.tipo IS DISTINCT FROM NEW.tipo THEN
    INSERT INTO public.atividade_historico (atividade_id, user_id, tipo_evento, campo_alterado, valor_anterior, valor_novo)
    VALUES (NEW.id, v_user_id, 'edicao', 'tipo', OLD.tipo, NEW.tipo);
  END IF;

  -- Categoria
  IF OLD.categoria IS DISTINCT FROM NEW.categoria THEN
    INSERT INTO public.atividade_historico (atividade_id, user_id, tipo_evento, campo_alterado, valor_anterior, valor_novo)
    VALUES (NEW.id, v_user_id, 'edicao', 'categoria', OLD.categoria, NEW.categoria);
  END IF;

  -- Gestor
  IF OLD.gestor_id IS DISTINCT FROM NEW.gestor_id THEN
    INSERT INTO public.atividade_historico (atividade_id, user_id, tipo_evento, campo_alterado, valor_anterior, valor_novo)
    VALUES (NEW.id, v_user_id, 'edicao', 'gestor_id', OLD.gestor_id::text, NEW.gestor_id::text);
  END IF;

  -- Cliente
  IF OLD.cliente_id IS DISTINCT FROM NEW.cliente_id THEN
    INSERT INTO public.atividade_historico (atividade_id, user_id, tipo_evento, campo_alterado, valor_anterior, valor_novo)
    VALUES (NEW.id, v_user_id, 'edicao', 'cliente_id', OLD.cliente_id::text, NEW.cliente_id::text);
  END IF;

  -- Empreendimento
  IF OLD.empreendimento_id IS DISTINCT FROM NEW.empreendimento_id THEN
    INSERT INTO public.atividade_historico (atividade_id, user_id, tipo_evento, campo_alterado, valor_anterior, valor_novo)
    VALUES (NEW.id, v_user_id, 'edicao', 'empreendimento_id', OLD.empreendimento_id::text, NEW.empreendimento_id::text);
  END IF;

  -- Data início
  IF OLD.data_inicio IS DISTINCT FROM NEW.data_inicio THEN
    INSERT INTO public.atividade_historico (atividade_id, user_id, tipo_evento, campo_alterado, valor_anterior, valor_novo)
    VALUES (NEW.id, v_user_id, 'edicao', 'data_inicio', OLD.data_inicio::text, NEW.data_inicio::text);
  END IF;

  -- Data fim
  IF OLD.data_fim IS DISTINCT FROM NEW.data_fim THEN
    INSERT INTO public.atividade_historico (atividade_id, user_id, tipo_evento, campo_alterado, valor_anterior, valor_novo)
    VALUES (NEW.id, v_user_id, 'edicao', 'data_fim', OLD.data_fim::text, NEW.data_fim::text);
  END IF;

  -- Resultado
  IF OLD.resultado IS DISTINCT FROM NEW.resultado THEN
    INSERT INTO public.atividade_historico (atividade_id, user_id, tipo_evento, campo_alterado, valor_anterior, valor_novo)
    VALUES (NEW.id, v_user_id, 'edicao', 'resultado', OLD.resultado, NEW.resultado);
  END IF;

  -- Motivo cancelamento
  IF OLD.motivo_cancelamento IS DISTINCT FROM NEW.motivo_cancelamento THEN
    INSERT INTO public.atividade_historico (atividade_id, user_id, tipo_evento, campo_alterado, valor_anterior, valor_novo)
    VALUES (NEW.id, v_user_id, 'edicao', 'motivo_cancelamento', OLD.motivo_cancelamento, NEW.motivo_cancelamento);
  END IF;

  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_cidades_corretores()
 RETURNS TABLE(cidade text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT DISTINCT cidade FROM (
    SELECT TRIM(c.cidade) as cidade
    FROM public.corretores c
    WHERE c.cidade IS NOT NULL 
      AND TRIM(c.cidade) <> ''
    UNION
    SELECT TRIM(i.endereco_cidade) as cidade
    FROM public.corretores c
    JOIN public.imobiliarias i ON i.id = c.imobiliaria_id
    WHERE (c.cidade IS NULL OR TRIM(c.cidade) = '')
      AND i.endereco_cidade IS NOT NULL
      AND TRIM(i.endereco_cidade) <> ''
  ) sub
  ORDER BY cidade;
$function$
;

CREATE OR REPLACE FUNCTION public.generate_cod_sorteio()
 RETURNS text
 LANGUAGE plpgsql
AS $function$
DECLARE
  chars text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  digits text := '0123456789';
  result text;
  attempts int := 0;
BEGIN
  LOOP
    result :=
      substr(digits, floor(random()*10+1)::int, 1) ||
      substr(digits, floor(random()*10+1)::int, 1) ||
      substr(digits, floor(random()*10+1)::int, 1) ||
      substr(digits, floor(random()*10+1)::int, 1) || '-' ||
      substr(chars, floor(random()*26+1)::int, 1) ||
      substr(digits, floor(random()*10+1)::int, 1) ||
      substr(chars, floor(random()*26+1)::int, 1) ||
      substr(digits, floor(random()*10+1)::int, 1) || '-' ||
      substr(chars, floor(random()*26+1)::int, 1) ||
      substr(chars, floor(random()*26+1)::int, 1) ||
      substr(chars, floor(random()*26+1)::int, 1) ||
      substr(chars, floor(random()*26+1)::int, 1);

    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.corretores WHERE cod_sorteio = result);
    attempts := attempts + 1;
    IF attempts > 100 THEN RAISE EXCEPTION 'Não foi possível gerar código único'; END IF;
  END LOOP;
  RETURN result;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.uppercase_corretores()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.nome_completo IS NOT NULL THEN NEW.nome_completo = UPPER(NEW.nome_completo); END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.uppercase_imobiliarias()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.nome IS NOT NULL THEN NEW.nome = UPPER(NEW.nome); END IF;
  IF NEW.endereco_logradouro IS NOT NULL THEN NEW.endereco_logradouro = UPPER(NEW.endereco_logradouro); END IF;
  IF NEW.endereco_bairro IS NOT NULL THEN NEW.endereco_bairro = UPPER(NEW.endereco_bairro); END IF;
  IF NEW.endereco_cidade IS NOT NULL THEN NEW.endereco_cidade = UPPER(NEW.endereco_cidade); END IF;
  IF NEW.endereco_complemento IS NOT NULL THEN NEW.endereco_complemento = UPPER(NEW.endereco_complemento); END IF;
  IF NEW.gestor_nome IS NOT NULL THEN NEW.gestor_nome = UPPER(NEW.gestor_nome); END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.uppercase_incorporadoras()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.nome IS NOT NULL THEN NEW.nome = UPPER(NEW.nome); END IF;
  IF NEW.razao_social IS NOT NULL THEN NEW.razao_social = UPPER(NEW.razao_social); END IF;
  IF NEW.endereco_logradouro IS NOT NULL THEN NEW.endereco_logradouro = UPPER(NEW.endereco_logradouro); END IF;
  IF NEW.endereco_bairro IS NOT NULL THEN NEW.endereco_bairro = UPPER(NEW.endereco_bairro); END IF;
  IF NEW.endereco_cidade IS NOT NULL THEN NEW.endereco_cidade = UPPER(NEW.endereco_cidade); END IF;
  IF NEW.endereco_complemento IS NOT NULL THEN NEW.endereco_complemento = UPPER(NEW.endereco_complemento); END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.uppercase_empreendimentos()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.nome IS NOT NULL THEN NEW.nome = UPPER(NEW.nome); END IF;
  IF NEW.endereco_logradouro IS NOT NULL THEN NEW.endereco_logradouro = UPPER(NEW.endereco_logradouro); END IF;
  IF NEW.endereco_bairro IS NOT NULL THEN NEW.endereco_bairro = UPPER(NEW.endereco_bairro); END IF;
  IF NEW.endereco_cidade IS NOT NULL THEN NEW.endereco_cidade = UPPER(NEW.endereco_cidade); END IF;
  IF NEW.endereco_complemento IS NOT NULL THEN NEW.endereco_complemento = UPPER(NEW.endereco_complemento); END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.uppercase_blocos()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.nome IS NOT NULL THEN NEW.nome = UPPER(NEW.nome); END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.uppercase_tipologias()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.nome IS NOT NULL THEN NEW.nome = UPPER(NEW.nome); END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.set_cod_sorteio()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$ BEGIN
  IF NEW.cod_sorteio IS NULL THEN
    NEW.cod_sorteio := public.generate_cod_sorteio();
  END IF;
  RETURN NEW;
END; $function$
;

CREATE OR REPLACE FUNCTION public.verificar_ficha_proposta_completa(neg_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_negociacao RECORD;
  v_cliente RECORD;
  v_tem_unidades boolean;
  v_tem_condicoes boolean;
BEGIN
  SELECT * INTO v_negociacao FROM public.negociacoes WHERE id = neg_id;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  IF v_negociacao.cliente_id IS NULL THEN
    RETURN false;
  END IF;
  
  SELECT * INTO v_cliente FROM public.clientes WHERE id = v_negociacao.cliente_id;
  
  -- Validação de documento conforme tipo_pessoa
  IF COALESCE(v_cliente.tipo_pessoa, 'fisica') = 'juridica' THEN
    -- PJ: exigir CNPJ
    IF v_cliente.cnpj IS NULL THEN
      RETURN false;
    END IF;
  ELSE
    -- PF: verificar nacionalidade
    IF v_cliente.nacionalidade IS NOT NULL 
       AND UPPER(v_cliente.nacionalidade) NOT LIKE '%BRASIL%' 
       AND UPPER(v_cliente.nacionalidade) NOT IN ('BRASILEIRO', 'BRASILEIRA') THEN
      -- Estrangeiro: exigir passaporte
      IF v_cliente.passaporte IS NULL THEN
        RETURN false;
      END IF;
    ELSE
      -- Brasileiro: exigir CPF
      IF v_cliente.cpf IS NULL THEN
        RETURN false;
      END IF;
    END IF;
  END IF;
  
  IF v_cliente.nome IS NULL OR v_cliente.email IS NULL THEN
    RETURN false;
  END IF;
  
  -- Estado civil apenas para PF
  IF COALESCE(v_cliente.tipo_pessoa, 'fisica') = 'fisica' AND v_cliente.estado_civil IS NULL THEN
    RETURN false;
  END IF;
  
  SELECT EXISTS(
    SELECT 1 FROM public.negociacao_unidades WHERE negociacao_id = neg_id
  ) INTO v_tem_unidades;
  
  IF NOT v_tem_unidades THEN
    RETURN false;
  END IF;
  
  SELECT EXISTS(
    SELECT 1 FROM public.negociacao_condicoes_pagamento WHERE negociacao_id = neg_id
  ) INTO v_tem_condicoes;
  
  IF NOT v_tem_condicoes THEN
    RETURN false;
  END IF;
  
  IF v_negociacao.valor_negociacao IS NULL OR v_negociacao.valor_negociacao <= 0 THEN
    RETURN false;
  END IF;
  
  RETURN true;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.generate_negociacao_proposta_numero()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN 'PROP-' || LPAD(nextval('negociacao_proposta_seq')::TEXT, 5, '0');
END;
$function$
;

CREATE OR REPLACE FUNCTION public.audit_trigger_func()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  _user_email text;
begin
  select email into _user_email from auth.users where id = auth.uid();
  
  if TG_OP = 'INSERT' then
    insert into public.audit_logs (user_id, user_email, action, table_name, record_id, new_data)
    values (auth.uid(), _user_email, 'create', TG_TABLE_NAME, NEW.id, to_jsonb(NEW));
    return NEW;
  elsif TG_OP = 'UPDATE' then
    insert into public.audit_logs (user_id, user_email, action, table_name, record_id, old_data, new_data)
    values (auth.uid(), _user_email, 'update', TG_TABLE_NAME, NEW.id, to_jsonb(OLD), to_jsonb(NEW));
    return NEW;
  elsif TG_OP = 'DELETE' then
    insert into public.audit_logs (user_id, user_email, action, table_name, record_id, old_data)
    values (auth.uid(), _user_email, 'delete', TG_TABLE_NAME, OLD.id, to_jsonb(OLD));
    return OLD;
  end if;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
begin
  NEW.updated_at = now();
  return NEW;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.generate_contrato_numero()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.numero := 'CONT-' || LPAD(nextval('contrato_numero_seq')::TEXT, 5, '0');
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.generate_reserva_protocolo()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.protocolo := 'RES-' || LPAD(nextval('reserva_protocolo_seq')::TEXT, 5, '0');
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.generate_projeto_codigo()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.codigo := 'MKT-' || LPAD(nextval('projeto_codigo_seq')::TEXT, 5, '0');
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.generate_evento_codigo()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.codigo := 'EVT-' || LPAD(nextval('evento_codigo_seq')::TEXT, 5, '0');
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_module_permission(_user_id uuid, _module_name text)
 RETURNS TABLE(can_view boolean, can_create boolean, can_edit boolean, can_delete boolean, scope text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT ump.can_view, ump.can_create, ump.can_edit, ump.can_delete, ump.scope
  FROM public.user_module_permissions ump
  JOIN public.modules m ON m.id = ump.module_id
  WHERE ump.user_id = _user_id
    AND m.name = _module_name
  LIMIT 1
$function$
;

CREATE OR REPLACE FUNCTION public.check_negociacao_proposta_expiracao()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Se proposta está enviada e passou da validade, expirar
  IF NEW.status_proposta = 'enviada' AND NEW.data_validade_proposta < CURRENT_DATE THEN
    NEW.status_proposta := 'expirada';
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.manage_negociacao_proposta_unidades_status()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Ao enviar proposta: reservar unidades
  IF NEW.status_proposta = 'enviada' AND (OLD.status_proposta IS NULL OR OLD.status_proposta = 'rascunho') THEN
    UPDATE public.unidades
    SET status = 'reservada'
    WHERE id IN (SELECT unidade_id FROM public.negociacao_unidades WHERE negociacao_id = NEW.id);
  
  -- Ao converter: marcar como vendida
  ELSIF NEW.status_proposta = 'convertida' AND OLD.status_proposta = 'aceita' THEN
    UPDATE public.unidades
    SET status = 'vendida'
    WHERE id IN (SELECT unidade_id FROM public.negociacao_unidades WHERE negociacao_id = NEW.id);
  
  -- Ao recusar ou expirar: liberar unidades
  ELSIF NEW.status_proposta IN ('recusada', 'expirada') AND OLD.status_proposta IN ('enviada', 'aceita') THEN
    UPDATE public.unidades
    SET status = 'disponivel'
    WHERE id IN (SELECT unidade_id FROM public.negociacao_unidades WHERE negociacao_id = NEW.id);
  END IF;
  
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.user_has_empreendimento_access(_user_id uuid, _empreendimento_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT 
    public.is_admin(_user_id) 
    OR public.has_role(_user_id, 'gestor_produto')
    OR public.is_seven_team(_user_id)
    -- Corretor e gestor_imobiliaria veem todos os empreendimentos ativos
    OR public.has_role(_user_id, 'corretor')
    OR public.is_gestor_imobiliaria(_user_id)
    -- Vínculo individual (user_empreendimentos)
    OR EXISTS (
      SELECT 1 FROM public.user_empreendimentos
      WHERE user_id = _user_id 
        AND empreendimento_id = _empreendimento_id
    )
    -- Acesso herdado via imobiliária
    OR EXISTS (
      SELECT 1 
      FROM public.corretores c
      JOIN public.empreendimento_imobiliarias ei ON ei.imobiliaria_id = c.imobiliaria_id
      WHERE c.user_id = _user_id 
        AND ei.empreendimento_id = _empreendimento_id
    )
    OR EXISTS (
      SELECT 1 
      FROM public.imobiliarias i
      JOIN public.empreendimento_imobiliarias ei ON ei.imobiliaria_id = i.id
      WHERE i.user_id = _user_id 
        AND ei.empreendimento_id = _empreendimento_id
    )
$function$
;

CREATE OR REPLACE FUNCTION public.generate_negociacao_codigo()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.codigo := 'NEG-' || LPAD(nextval('negociacao_codigo_seq')::TEXT, 5, '0');
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.generate_proposta_numero()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  year_prefix TEXT;
  next_num INTEGER;
BEGIN
  year_prefix := TO_CHAR(CURRENT_DATE, 'YYYY');
  SELECT COALESCE(MAX(CAST(SUBSTRING(numero FROM 6) AS INTEGER)), 0) + 1
  INTO next_num
  FROM propostas
  WHERE numero LIKE year_prefix || '-%';
  NEW.numero := year_prefix || '-' || LPAD(next_num::TEXT, 5, '0');
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.is_marketing_supervisor(_user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 
    FROM public.user_roles ur
    JOIN public.roles r ON r.id = ur.role_id
    WHERE ur.user_id = _user_id
    AND r.name IN (
      -- Nomes legados (compatibilidade)
      'supervisor_relacionamento', 
      'supervisor_render', 
      'supervisor_criacao', 
      'supervisor_video', 
      'equipe_marketing',
      'diretor_de_marketing',
      -- Novos nomes dinâmicos (criados via interface)
      'supervisão_de_criação',
      'supervisão_de_render',
      'supervisão_de_vídeo',
      'supervisão_de_relacionamento'
    )
    AND r.is_active = true
  )
$function$
;

CREATE OR REPLACE FUNCTION public.is_cliente_externo(_user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT public.has_role(_user_id, 'cliente_externo')
$function$
;

CREATE OR REPLACE FUNCTION public.check_proposta_expiracao()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Se proposta está enviada e passou da validade, expirar
  IF NEW.status = 'enviada' AND NEW.data_validade < CURRENT_DATE THEN
    NEW.status := 'expirada';
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.manage_proposta_unidades_status()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Ao enviar proposta: reservar unidades
  IF NEW.status = 'enviada' AND (OLD.status IS NULL OR OLD.status = 'rascunho') THEN
    UPDATE public.unidades
    SET status = 'reservada'
    WHERE id IN (SELECT unidade_id FROM public.proposta_unidades WHERE proposta_id = NEW.id);
  
  -- Ao aceitar proposta: manter reservadas
  ELSIF NEW.status = 'aceita' AND OLD.status = 'enviada' THEN
    -- Unidades continuam reservadas até conversão
    NULL;
  
  -- Ao converter: marcar como vendida
  ELSIF NEW.status = 'convertida' AND OLD.status = 'aceita' THEN
    UPDATE public.unidades
    SET status = 'vendida'
    WHERE id IN (SELECT unidade_id FROM public.proposta_unidades WHERE proposta_id = NEW.id);
  
  -- Ao recusar ou expirar: liberar unidades
  ELSIF NEW.status IN ('recusada', 'expirada') AND OLD.status IN ('enviada', 'aceita') THEN
    UPDATE public.unidades
    SET status = 'disponivel'
    WHERE id IN (SELECT unidade_id FROM public.proposta_unidades WHERE proposta_id = NEW.id);
  END IF;
  
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.generate_comissao_numero()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.numero := 'COM-' || LPAD(nextval('comissao_numero_seq')::TEXT, 5, '0');
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.reset_sequence_value(seq_name text, new_value bigint)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  allowed_sequences text[] := ARRAY[
    'negociacao_codigo_seq',
    'negociacao_proposta_seq',
    'proposta_numero_seq',
    'briefing_codigo_seq',
    'projeto_codigo_seq',
    'contrato_numero_seq',
    'comissao_numero_seq',
    'evento_codigo_seq',
    'reserva_protocolo_seq'
  ];
BEGIN
  IF NOT public.is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Acesso negado: apenas super administradores';
  END IF;

  IF NOT (seq_name = ANY(allowed_sequences)) THEN
    RAISE EXCEPTION 'Sequence não permitida: %', seq_name;
  END IF;
  
  IF new_value < 1 THEN
    RAISE EXCEPTION 'Valor deve ser >= 1';
  END IF;

  EXECUTE format('ALTER SEQUENCE public.%I RESTART WITH %s', seq_name, new_value);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_all_sequence_values()
 RETURNS TABLE(seq_name text, last_value bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Acesso negado: apenas super administradores';
  END IF;

  RETURN QUERY
  SELECT 'negociacao_codigo_seq'::text, (SELECT s.last_value FROM public.negociacao_codigo_seq s)
  UNION ALL
  SELECT 'negociacao_proposta_seq'::text, (SELECT s.last_value FROM public.negociacao_proposta_seq s)
  UNION ALL
  SELECT 'proposta_numero_seq'::text, (SELECT s.last_value FROM public.proposta_numero_seq s)
  UNION ALL
  SELECT 'briefing_codigo_seq'::text, (SELECT s.last_value FROM public.briefing_codigo_seq s)
  UNION ALL
  SELECT 'projeto_codigo_seq'::text, (SELECT s.last_value FROM public.projeto_codigo_seq s)
  UNION ALL
  SELECT 'contrato_numero_seq'::text, (SELECT s.last_value FROM public.contrato_numero_seq s)
  UNION ALL
  SELECT 'comissao_numero_seq'::text, (SELECT s.last_value FROM public.comissao_numero_seq s)
  UNION ALL
  SELECT 'evento_codigo_seq'::text, (SELECT s.last_value FROM public.evento_codigo_seq s)
  UNION ALL
  SELECT 'reserva_protocolo_seq'::text, (SELECT s.last_value FROM public.reserva_protocolo_seq s);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT r.name 
  FROM public.user_roles ur
  JOIN public.roles r ON r.id = ur.role_id
  WHERE ur.user_id = _user_id
  LIMIT 1
$function$
;

CREATE OR REPLACE FUNCTION public.has_role_by_id(_user_id uuid, _role_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.roles r ON r.id = ur.role_id
    WHERE ur.user_id = _user_id
      AND ur.role_id = _role_id
      AND r.is_active = true
  )
$function$
;

CREATE OR REPLACE FUNCTION public.prevent_gestor_id_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF OLD.gestor_id IS NOT NULL 
     AND NEW.gestor_id IS DISTINCT FROM OLD.gestor_id 
     AND NOT public.is_super_admin(auth.uid()) THEN
    NEW.gestor_id := OLD.gestor_id;
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT public.has_role(_user_id, 'super_admin')
$function$
;

CREATE OR REPLACE FUNCTION public.get_role_id(_role_name text)
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT id FROM public.roles WHERE name = _role_name LIMIT 1
$function$
;

CREATE OR REPLACE FUNCTION public.generate_signature_token()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN encode(gen_random_bytes(32), 'hex');
END;
$function$
;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  )
$function$
;

CREATE OR REPLACE FUNCTION public.get_module_scope(_user_id uuid, _module_name text)
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select rp.scope
  from public.role_permissions rp
  join public.modules m on m.id = rp.module_id
  join public.user_roles ur on ur.role = rp.role
  where ur.user_id = _user_id
    and m.name = _module_name
  limit 1
$function$
;

CREATE OR REPLACE FUNCTION public.can_access_module(_user_id uuid, _module_name text, _action text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select exists (
    select 1 
    from public.role_permissions rp
    join public.modules m on m.id = rp.module_id
    join public.user_roles ur on ur.role = rp.role
    where ur.user_id = _user_id
      and m.name = _module_name
      and m.is_active = true
      and (
        (_action = 'view' and rp.can_view) or
        (_action = 'create' and rp.can_create) or
        (_action = 'edit' and rp.can_edit) or
        (_action = 'delete' and rp.can_delete)
      )
  )
$function$
;

CREATE OR REPLACE FUNCTION public.can_access_empreendimento(_user_id uuid, _empreendimento_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select 
    public.is_admin(_user_id) 
    or exists (
      select 1 from public.user_empreendimentos
      where user_id = _user_id 
        and empreendimento_id = _empreendimento_id
    )
$function$
;

CREATE OR REPLACE FUNCTION public.can_access_module_v2(_user_id uuid, _module_name text, _action text)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _custom_perm RECORD;
  _role_perm RECORD;
BEGIN
  -- Admin tem acesso total
  IF public.is_admin(_user_id) THEN
    RETURN true;
  END IF;

  -- Primeiro verifica permissões customizadas do usuário
  SELECT ump.can_view, ump.can_create, ump.can_edit, ump.can_delete
  INTO _custom_perm
  FROM public.user_module_permissions ump
  JOIN public.modules m ON m.id = ump.module_id
  WHERE ump.user_id = _user_id
    AND m.name = _module_name
    AND m.is_active = true;

  -- Se encontrou permissão customizada, usa ela
  IF FOUND THEN
    RETURN CASE _action
      WHEN 'view' THEN _custom_perm.can_view
      WHEN 'create' THEN _custom_perm.can_create
      WHEN 'edit' THEN _custom_perm.can_edit
      WHEN 'delete' THEN _custom_perm.can_delete
      ELSE false
    END;
  END IF;

  -- Senão, usa permissão do role
  SELECT rp.can_view, rp.can_create, rp.can_edit, rp.can_delete
  INTO _role_perm
  FROM public.role_permissions rp
  JOIN public.modules m ON m.id = rp.module_id
  JOIN public.user_roles ur ON ur.role = rp.role
  WHERE ur.user_id = _user_id
    AND m.name = _module_name
    AND m.is_active = true;

  IF FOUND THEN
    RETURN CASE _action
      WHEN 'view' THEN _role_perm.can_view
      WHEN 'create' THEN _role_perm.can_create
      WHEN 'edit' THEN _role_perm.can_edit
      WHEN 'delete' THEN _role_perm.can_delete
      ELSE false
    END;
  END IF;

  RETURN false;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_unidades_disponiveis_bk()
 RETURNS TABLE(empreendimento text, bloco text, andar integer, unidade text, tipologia text, quartos integer, suites integer, vagas integer, area_privativa numeric, valor numeric, status text, unidade_id uuid)
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
  SELECT
    e.nome                  AS empreendimento,
    b.nome                  AS bloco,
    u.andar,
    u.numero                AS unidade,
    t.nome                  AS tipologia,
    t.quartos,
    t.suites,
    t.vagas,
    u.area_privativa,
    u.valor,
    u.status::TEXT,
    u.id                    AS unidade_id
  FROM unidades u
  JOIN empreendimentos e ON e.id = u.empreendimento_id
  LEFT JOIN blocos b      ON b.id = u.bloco_id
  LEFT JOIN tipologias t  ON t.id = u.tipologia_id
  WHERE
    e.incorporadora_id = 'a682aefc-7d06-4c86-a150-200fb8583b0b'
    AND e.is_active = true
    AND u.is_active = true
    AND u.status = 'disponivel'
  ORDER BY
    e.nome,
    b.nome,
    u.andar,
    u.numero;
$function$
;

-- 5) Tabelas ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.atividade_comentarios (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  atividade_id uuid NOT NULL,
  user_id uuid,
  comentario text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.atividade_etapas (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  cor text NOT NULL DEFAULT '#3b82f6'::text,
  cor_bg text NOT NULL DEFAULT '#dbeafe'::text,
  ordem integer NOT NULL DEFAULT 0,
  is_inicial boolean NOT NULL DEFAULT false,
  is_final boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.atividade_historico (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  atividade_id uuid NOT NULL,
  user_id uuid,
  tipo_evento text NOT NULL,
  campo_alterado text,
  valor_anterior text,
  valor_novo text,
  observacao text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.atividade_responsaveis (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  atividade_id uuid NOT NULL,
  user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.atividades (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tipo text NOT NULL,
  titulo text NOT NULL,
  cliente_id uuid,
  corretor_id uuid,
  imobiliaria_id uuid,
  empreendimento_id uuid,
  gestor_id uuid,
  status text NOT NULL DEFAULT 'pendente'::text,
  resultado text,
  observacoes text,
  temperatura_cliente text,
  requer_followup boolean DEFAULT false,
  data_followup timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  categoria text NOT NULL DEFAULT 'seven'::text,
  created_by uuid,
  deadline_date date,
  motivo_cancelamento text,
  data_inicio date NOT NULL,
  data_fim date NOT NULL,
  hora_inicio time without time zone,
  hora_fim time without time zone,
  subtipo text,
  atividade_etapa_id uuid,
  cronometro_inicio timestamp with time zone,
  cronometro_fim timestamp with time zone,
  duracao_minutos integer,
  qtd_participantes integer,
  qtd_corretores integer,
  destaque boolean NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  user_email text,
  action text NOT NULL,
  table_name text NOT NULL,
  record_id uuid,
  old_data jsonb,
  new_data jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.blocos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  empreendimento_id uuid NOT NULL,
  nome text NOT NULL,
  total_andares integer,
  unidades_por_andar integer,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.bonificacoes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  empreendimento_id uuid NOT NULL,
  user_id uuid NOT NULL,
  tipo text NOT NULL,
  periodo_inicio date NOT NULL,
  periodo_fim date NOT NULL,
  meta_unidades integer,
  unidades_vendidas integer DEFAULT 0,
  valor_bonificacao numeric DEFAULT 0,
  percentual_atingimento numeric DEFAULT 0,
  status text DEFAULT 'pendente'::text,
  nf_numero text,
  nf_quitada boolean DEFAULT false,
  data_pagamento date,
  observacoes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.boxes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  empreendimento_id uuid NOT NULL,
  bloco_id uuid,
  numero character varying(20) NOT NULL,
  tipo character varying(20) NOT NULL DEFAULT 'simples'::character varying,
  coberto boolean NOT NULL DEFAULT false,
  valor numeric(15,2),
  status character varying(20) NOT NULL DEFAULT 'disponivel'::character varying,
  unidade_id uuid,
  observacoes text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.briefing_referencias (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  briefing_id uuid NOT NULL,
  tipo text NOT NULL,
  url text NOT NULL,
  titulo text,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.briefings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  codigo text NOT NULL,
  cliente text NOT NULL,
  tema text NOT NULL,
  objetivo text,
  head_titulo text,
  sub_complemento text,
  mensagem_chave text,
  formato_peca text,
  tom_comunicacao text,
  estilo_visual text,
  composicao text,
  importante text,
  diretrizes_visuais text,
  referencia text,
  observacoes text,
  empreendimento_id uuid,
  criado_por uuid,
  triado_por uuid,
  status briefing_status NOT NULL DEFAULT 'pendente'::briefing_status,
  data_triagem timestamp with time zone,
  data_entrega timestamp with time zone,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  referencia_imagem_url text
);

CREATE TABLE IF NOT EXISTS public.categorias_fluxo (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  tipo text NOT NULL,
  categoria_pai_id uuid,
  ordem integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  aprovacao_automatica boolean DEFAULT false
);

CREATE TABLE IF NOT EXISTS public.centro_custo_empreendimentos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  centro_custo_id uuid NOT NULL,
  empreendimento_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.centros_custo (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  descricao text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.cliente_interacoes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  cliente_id uuid NOT NULL,
  user_id uuid,
  tipo text NOT NULL,
  descricao text,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.cliente_socios (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  cliente_id uuid NOT NULL,
  socio_id uuid NOT NULL,
  percentual_participacao numeric(5,2),
  observacao text,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.cliente_telefones (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  cliente_id uuid NOT NULL,
  numero text NOT NULL,
  is_whatsapp boolean DEFAULT false,
  descricao text,
  principal boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.clientes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  email text,
  telefone text,
  whatsapp text,
  cpf text,
  rg text,
  data_nascimento date,
  profissao text,
  renda_mensal numeric,
  endereco_logradouro text,
  endereco_numero text,
  endereco_complemento text,
  endereco_bairro text,
  endereco_cidade text,
  endereco_uf text,
  endereco_cep text,
  origem text,
  interesse text[],
  observacoes text,
  lead_id uuid,
  corretor_id uuid,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  gestor_id uuid,
  fase text DEFAULT 'prospecto'::text,
  temperatura text DEFAULT 'frio'::text,
  imobiliaria_id uuid,
  data_qualificacao timestamp with time zone,
  data_primeira_negociacao timestamp with time zone,
  data_primeira_compra timestamp with time zone,
  motivo_perda text,
  data_perda timestamp with time zone,
  estado_civil text,
  nacionalidade text,
  nome_mae text,
  nome_pai text,
  empreendimento_id uuid,
  conjuge_id uuid,
  passaporte text,
  tipo_pessoa text DEFAULT 'fisica'::text,
  cnpj text,
  razao_social text,
  inscricao_estadual text
);

CREATE TABLE IF NOT EXISTS public.comissao_parcelas (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  comissao_id uuid NOT NULL,
  tipo text NOT NULL,
  parcela integer NOT NULL,
  valor numeric(15,2) NOT NULL,
  data_vencimento date NOT NULL,
  data_pagamento date,
  status parcela_status NOT NULL DEFAULT 'pendente'::parcela_status,
  comprovante_url text,
  observacao text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.comissoes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  numero text NOT NULL,
  contrato_id uuid,
  empreendimento_id uuid NOT NULL,
  corretor_id uuid,
  imobiliaria_id uuid,
  valor_venda numeric(15,2) NOT NULL,
  percentual_corretor numeric(5,2) DEFAULT 0,
  valor_corretor numeric(15,2) DEFAULT 0,
  percentual_imobiliaria numeric(5,2) DEFAULT 0,
  valor_imobiliaria numeric(15,2) DEFAULT 0,
  status_corretor comissao_status NOT NULL DEFAULT 'pendente'::comissao_status,
  status_imobiliaria comissao_status NOT NULL DEFAULT 'pendente'::comissao_status,
  data_pagamento_corretor date,
  data_pagamento_imobiliaria date,
  nf_corretor text,
  nf_imobiliaria text,
  observacoes text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  gestor_id uuid,
  nf_quitada boolean DEFAULT false,
  percentual_comissao numeric DEFAULT 0,
  valor_comissao numeric DEFAULT 0,
  status comissao_status DEFAULT 'pendente'::comissao_status,
  data_pagamento date,
  nf_numero text,
  estornada boolean DEFAULT false,
  data_estorno timestamp with time zone,
  created_by uuid,
  updated_by uuid
);

CREATE TABLE IF NOT EXISTS public.configuracao_comercial (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  empreendimento_id uuid NOT NULL,
  valor_m2 numeric NOT NULL DEFAULT 409.28,
  data_referencia date NOT NULL DEFAULT CURRENT_DATE,
  desconto_avista numeric DEFAULT 7.0,
  entrada_curto_prazo numeric DEFAULT 10.0,
  parcelas_curto_prazo integer DEFAULT 24,
  entrada_minima numeric DEFAULT 6.0,
  max_parcelas_entrada integer DEFAULT 10,
  max_parcelas_mensais integer DEFAULT 180,
  taxa_juros_anual numeric DEFAULT 11.0,
  indice_reajuste text DEFAULT 'IPCA'::text,
  limite_parcelas_anuais numeric DEFAULT 25.0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.configuracao_comissoes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  empreendimento_id uuid,
  percentual_padrao_corretor numeric(5,2) DEFAULT 3.00,
  percentual_padrao_imobiliaria numeric(5,2) DEFAULT 5.00,
  regra_calculo text DEFAULT 'valor_venda'::text,
  observacoes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.configuracoes_sistema (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  chave text NOT NULL,
  valor text NOT NULL,
  categoria text NOT NULL DEFAULT 'geral'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.contrato_aprovacoes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  contrato_id uuid NOT NULL,
  etapa integer NOT NULL DEFAULT 1,
  tipo_aprovador aprovador_tipo NOT NULL,
  aprovador_id uuid,
  status aprovacao_status NOT NULL DEFAULT 'pendente'::aprovacao_status,
  observacao text,
  data_envio timestamp with time zone,
  data_resposta timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.contrato_condicoes_pagamento (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  contrato_id uuid NOT NULL,
  tipo_parcela_codigo text NOT NULL,
  ordem integer DEFAULT 0,
  descricao text,
  quantidade integer DEFAULT 1,
  valor numeric,
  valor_tipo text DEFAULT 'fixo'::text,
  data_vencimento date,
  intervalo_dias integer DEFAULT 30,
  evento_vencimento text,
  com_correcao boolean DEFAULT false,
  indice_correcao text DEFAULT 'INCC'::text,
  parcelas_sem_correcao integer DEFAULT 0,
  forma_quitacao text DEFAULT 'dinheiro'::text,
  forma_pagamento text DEFAULT 'boleto'::text,
  bem_descricao text,
  bem_marca text,
  bem_modelo text,
  bem_ano text,
  bem_placa text,
  bem_cor text,
  bem_renavam text,
  bem_matricula text,
  bem_cartorio text,
  bem_endereco text,
  bem_area_m2 numeric,
  bem_valor_avaliado numeric,
  bem_observacoes text,
  beneficiario_tipo text,
  beneficiario_id uuid,
  observacao_texto text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.contrato_documentos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  contrato_id uuid NOT NULL,
  tipo text NOT NULL,
  nome text NOT NULL,
  arquivo_url text,
  status documento_contrato_status NOT NULL DEFAULT 'pendente'::documento_contrato_status,
  obrigatorio boolean NOT NULL DEFAULT false,
  observacao text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.contrato_pendencias (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  contrato_id uuid NOT NULL,
  descricao text NOT NULL,
  responsavel_id uuid,
  prazo date,
  status pendencia_status NOT NULL DEFAULT 'aberta'::pendencia_status,
  resolucao text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.contrato_signatarios (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  contrato_id uuid NOT NULL,
  tipo signatario_tipo NOT NULL,
  nome text NOT NULL,
  email text,
  telefone text,
  cpf text,
  ordem integer NOT NULL DEFAULT 1,
  obrigatorio boolean NOT NULL DEFAULT true,
  status signatario_status NOT NULL DEFAULT 'pendente'::signatario_status,
  data_envio timestamp with time zone,
  data_visualizacao timestamp with time zone,
  data_assinatura timestamp with time zone,
  ip_assinatura text,
  user_agent text,
  motivo_recusa text,
  token_assinatura text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  tem_conjuge boolean DEFAULT false,
  conjuge_nome text,
  conjuge_cpf text,
  conjuge_email text,
  regime_bens text
);

CREATE TABLE IF NOT EXISTS public.contrato_template_imagens (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL,
  nome text NOT NULL,
  arquivo_url text NOT NULL,
  largura integer,
  altura integer,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.contrato_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  descricao text,
  conteudo_html text NOT NULL,
  variaveis jsonb DEFAULT '["nome_cliente", "cpf", "rg", "endereco_cliente", "empreendimento", "unidade", "bloco", "matricula", "memorial", "valor", "data_atual"]'::jsonb,
  empreendimento_id uuid,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.contrato_unidades (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  contrato_id uuid NOT NULL,
  unidade_id uuid NOT NULL,
  valor_unidade numeric,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.contrato_variaveis (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  chave text NOT NULL,
  label text NOT NULL,
  exemplo text,
  categoria text DEFAULT 'geral'::text,
  tipo text DEFAULT 'texto'::text,
  origem text,
  campo_origem text,
  is_sistema boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.contrato_versoes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  contrato_id uuid NOT NULL,
  versao integer NOT NULL,
  conteudo_html text NOT NULL,
  alterado_por uuid,
  motivo_alteracao text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.contratos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  numero text NOT NULL,
  cliente_id uuid NOT NULL,
  empreendimento_id uuid NOT NULL,
  corretor_id uuid,
  imobiliaria_id uuid,
  template_id uuid,
  status contrato_status NOT NULL DEFAULT 'em_geracao'::contrato_status,
  conteudo_html text,
  versao integer NOT NULL DEFAULT 1,
  valor_contrato numeric,
  data_geracao date NOT NULL DEFAULT CURRENT_DATE,
  data_envio_assinatura date,
  data_assinatura date,
  data_envio_incorporador date,
  data_aprovacao date,
  motivo_reprovacao text,
  observacoes text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  percentual_corretagem numeric,
  valor_corretagem numeric,
  corretagem_texto text,
  gestor_id uuid,
  created_by uuid,
  updated_by uuid,
  negociacao_id uuid,
  modalidade_id uuid
);

CREATE TABLE IF NOT EXISTS public.corretores (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nome_completo text NOT NULL,
  cpf text,
  imobiliaria_id uuid,
  telefone text,
  whatsapp text,
  email text,
  creci text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  user_id uuid,
  cidade text,
  uf text,
  send_campanha character varying(2) DEFAULT '1'::character varying,
  cod_sorteio text,
  status_vinculo text DEFAULT 'ativo'::text
);

CREATE TABLE IF NOT EXISTS public.empreendimento_corretores (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  empreendimento_id uuid NOT NULL,
  corretor_id uuid NOT NULL,
  autorizado_em timestamp with time zone NOT NULL DEFAULT now(),
  autorizado_por uuid
);

CREATE TABLE IF NOT EXISTS public.empreendimento_documentos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  empreendimento_id uuid NOT NULL,
  tipo documento_tipo NOT NULL DEFAULT 'outro'::documento_tipo,
  nome text NOT NULL,
  descricao text,
  arquivo_url text NOT NULL,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.empreendimento_imobiliarias (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  empreendimento_id uuid NOT NULL,
  imobiliaria_id uuid NOT NULL,
  comissao_percentual numeric(5,2),
  autorizado_em timestamp with time zone NOT NULL DEFAULT now(),
  autorizado_por uuid
);

CREATE TABLE IF NOT EXISTS public.empreendimento_midias (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  empreendimento_id uuid NOT NULL,
  tipo midia_tipo NOT NULL DEFAULT 'imagem'::midia_tipo,
  nome text,
  url text NOT NULL,
  is_capa boolean NOT NULL DEFAULT false,
  ordem integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.empreendimentos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  tipo empreendimento_tipo NOT NULL,
  status empreendimento_status NOT NULL DEFAULT 'lancamento'::empreendimento_status,
  incorporadora text,
  construtora text,
  responsavel_comercial_id uuid,
  descricao_curta text,
  descricao_completa text,
  endereco_logradouro text,
  endereco_numero text,
  endereco_complemento text,
  endereco_bairro text,
  endereco_cidade text,
  endereco_uf text,
  endereco_cep text,
  latitude numeric(10,7),
  longitude numeric(10,7),
  total_unidades integer DEFAULT 0,
  infraestrutura text[],
  registro_incorporacao text,
  matricula_mae text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  data_inicio_contrato date,
  meta_6_meses integer DEFAULT 0,
  meta_12_meses integer DEFAULT 0,
  legenda_status_visiveis text[] DEFAULT ARRAY['disponivel'::text, 'reservada'::text, 'vendida'::text, 'bloqueada'::text],
  mapa_label_formato text[] DEFAULT ARRAY['bloco'::text, 'tipologia'::text, 'numero'::text],
  incorporadora_id uuid,
  auto_vincular_corretor boolean NOT NULL DEFAULT true,
  texto_rodape_relatorio text
);

CREATE TABLE IF NOT EXISTS public.evento_inscricoes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  evento_id uuid NOT NULL,
  corretor_id uuid,
  user_id uuid NOT NULL,
  nome_corretor text NOT NULL,
  telefone text,
  email text,
  imobiliaria_nome text,
  status text NOT NULL DEFAULT 'confirmada'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.evento_membros (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  evento_id uuid NOT NULL,
  user_id uuid NOT NULL,
  papel text DEFAULT 'membro'::text,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.evento_tarefas (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  evento_id uuid NOT NULL,
  titulo text NOT NULL,
  responsavel_id uuid,
  data_inicio date,
  data_fim date,
  status text DEFAULT 'pendente'::text,
  dependencia_id uuid,
  ordem integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.evento_template_tarefas (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL,
  titulo text NOT NULL,
  descricao text,
  dias_antes_evento integer DEFAULT 0,
  duracao_horas integer DEFAULT 24,
  ordem integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.evento_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  descricao text,
  duracao_dias integer DEFAULT 1,
  orcamento_padrao numeric DEFAULT 0,
  local_padrao text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.eventos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  codigo text NOT NULL,
  nome text NOT NULL,
  descricao text,
  empreendimento_id uuid,
  data_evento date NOT NULL,
  local text,
  responsavel_id uuid,
  status text DEFAULT 'planejamento'::text,
  orcamento numeric,
  created_by uuid,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  inscricoes_abertas boolean NOT NULL DEFAULT false,
  limite_inscricoes integer
);

CREATE TABLE IF NOT EXISTS public.fachadas (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  empreendimento_id uuid NOT NULL,
  nome text NOT NULL,
  descricao text,
  imagem_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.fluxo_aprovacao_config (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  empreendimento_id uuid,
  etapa integer NOT NULL,
  tipo_aprovador aprovador_tipo NOT NULL,
  nome_etapa text NOT NULL,
  obrigatoria boolean NOT NULL DEFAULT true,
  prazo_horas integer DEFAULT 48,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.funil_etapas (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  funil_id uuid NOT NULL,
  nome text NOT NULL,
  codigo text NOT NULL,
  cor text NOT NULL DEFAULT '#6b7280'::text,
  cor_bg text DEFAULT '#f3f4f6'::text,
  icone text,
  ordem integer NOT NULL DEFAULT 0,
  is_inicial boolean DEFAULT false,
  is_final_sucesso boolean DEFAULT false,
  is_final_perda boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  visivel_incorporador boolean NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS public.funis (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  descricao text,
  empreendimento_id uuid,
  is_default boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.google_calendar_embeds (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  nome text NOT NULL DEFAULT 'Google Calendar'::text,
  embed_url text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.imobiliarias (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  cnpj text,
  site text,
  endereco_logradouro text,
  endereco_numero text,
  endereco_complemento text,
  endereco_bairro text,
  endereco_cidade text,
  endereco_uf text,
  endereco_cep text,
  gestor_nome text,
  gestor_telefone text,
  gestor_email text,
  telefone text,
  whatsapp text,
  email text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  user_id uuid,
  tipo_pessoa text NOT NULL DEFAULT 'juridica'::text,
  cpf text
);

CREATE TABLE IF NOT EXISTS public.incorporadoras (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  cnpj text,
  razao_social text,
  telefone text,
  email text,
  endereco_logradouro text,
  endereco_numero text,
  endereco_bairro text,
  endereco_cidade text,
  endereco_uf text,
  endereco_cep text,
  logo_url text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  endereco_complemento text
);

CREATE TABLE IF NOT EXISTS public.lancamentos_financeiros (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tipo text NOT NULL,
  conta_id uuid,
  descricao text NOT NULL,
  valor numeric NOT NULL,
  data_vencimento date NOT NULL,
  data_pagamento date,
  data_competencia date,
  status text DEFAULT 'pendente'::text,
  comissao_id uuid,
  bonificacao_id uuid,
  contrato_id uuid,
  empreendimento_id uuid,
  nf_numero text,
  nf_quitada boolean DEFAULT false,
  observacoes text,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  categoria_fluxo text,
  subcategoria text,
  status_conferencia text DEFAULT 'pendente'::text,
  conferido_por uuid,
  conferido_em timestamp with time zone,
  centro_custo_id uuid,
  is_recorrente boolean DEFAULT false,
  recorrencia_pai_id uuid,
  recorrencia_frequencia text,
  beneficiario_id uuid,
  beneficiario_tipo text
);

CREATE TABLE IF NOT EXISTS public.mapa_empreendimento (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  empreendimento_id uuid NOT NULL,
  imagem_url text NOT NULL,
  largura integer,
  altura integer,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.metas_comerciais (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  competencia date NOT NULL,
  empreendimento_id uuid,
  corretor_id uuid,
  meta_valor numeric NOT NULL DEFAULT 0,
  meta_unidades integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  meta_visitas integer NOT NULL DEFAULT 0,
  meta_atendimentos integer NOT NULL DEFAULT 0,
  meta_treinamentos integer NOT NULL DEFAULT 0,
  meta_propostas integer NOT NULL DEFAULT 0,
  periodicidade text NOT NULL DEFAULT 'mensal'::text,
  gestor_id uuid,
  tipo text NOT NULL DEFAULT 'comercial'::text,
  meta_ligacoes integer NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.modalidade_componentes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  modalidade_id uuid NOT NULL,
  tipo_parcela_codigo text NOT NULL,
  ordem integer DEFAULT 0,
  valor_percentual numeric,
  valor_fixo numeric,
  quantidade integer DEFAULT 1,
  intervalo_dias integer DEFAULT 30,
  com_correcao boolean DEFAULT false,
  indice_correcao text DEFAULT 'INCC'::text,
  parcelas_sem_correcao integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.modalidades_pagamento (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  empreendimento_id uuid,
  nome text NOT NULL,
  descricao text,
  percentual_entrada numeric,
  parcelas_entrada integer DEFAULT 1,
  parcelas_mensais integer,
  taxa_juros numeric,
  indice_correcao text DEFAULT 'INCC'::text,
  incluir_baloes boolean DEFAULT false,
  percentual_balao numeric,
  is_padrao boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.modules (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  display_name text NOT NULL,
  description text,
  icon text,
  route text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  category text
);

CREATE TABLE IF NOT EXISTS public.negociacao_clientes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  negociacao_id uuid NOT NULL,
  cliente_id uuid NOT NULL,
  tipo text NOT NULL DEFAULT 'titular'::text,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.negociacao_comentarios (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  negociacao_id uuid NOT NULL,
  user_id uuid,
  comentario text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.negociacao_condicoes_pagamento (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  negociacao_id uuid NOT NULL,
  tipo_parcela_codigo text NOT NULL,
  ordem integer DEFAULT 0,
  quantidade integer DEFAULT 1,
  valor numeric,
  valor_tipo text DEFAULT 'fixo'::text,
  data_vencimento date,
  intervalo_dias integer DEFAULT 30,
  evento_vencimento text,
  com_correcao boolean DEFAULT false,
  indice_correcao text DEFAULT 'INCC'::text,
  parcelas_sem_correcao integer DEFAULT 0,
  forma_pagamento text DEFAULT 'boleto'::text,
  forma_quitacao text DEFAULT 'dinheiro'::text,
  descricao text,
  observacao_texto text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.negociacao_dacao_anexos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  negociacao_id uuid NOT NULL,
  tipo_dacao text NOT NULL DEFAULT 'outro'::text,
  descricao text,
  arquivo_url text NOT NULL,
  arquivo_nome text,
  created_at timestamp with time zone DEFAULT now(),
  created_by uuid
);

CREATE TABLE IF NOT EXISTS public.negociacao_historico (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  negociacao_id uuid NOT NULL,
  user_id uuid,
  etapa_anterior etapa_funil,
  etapa_nova etapa_funil,
  observacao text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  funil_etapa_anterior_id uuid,
  funil_etapa_nova_id uuid
);

CREATE TABLE IF NOT EXISTS public.negociacao_unidades (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  negociacao_id uuid NOT NULL,
  unidade_id uuid NOT NULL,
  valor_unidade numeric,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  valor_tabela numeric,
  valor_proposta numeric
);

CREATE TABLE IF NOT EXISTS public.negociacoes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  codigo text NOT NULL,
  cliente_id uuid NOT NULL,
  empreendimento_id uuid NOT NULL,
  corretor_id uuid,
  imobiliaria_id uuid,
  etapa etapa_funil NOT NULL DEFAULT 'lead'::etapa_funil,
  valor_negociacao numeric,
  valor_entrada numeric,
  condicao_pagamento text,
  observacoes text,
  motivo_perda text,
  data_previsao_fechamento date,
  data_fechamento date,
  ordem_kanban integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  funil_etapa_id uuid,
  numero_proposta text,
  status_proposta text,
  data_emissao_proposta date,
  data_validade_proposta date,
  valor_tabela numeric,
  valor_proposta numeric,
  desconto_percentual numeric,
  desconto_valor numeric,
  motivo_recusa text,
  data_aceite date,
  data_conversao date,
  contrato_id uuid,
  simulacao_dados jsonb,
  status_aprovacao text,
  solicitada_em timestamp with time zone,
  aprovada_em timestamp with time zone,
  rejeitada_em timestamp with time zone,
  motivo_rejeicao text,
  valor_total_fechamento numeric,
  indice_correcao text DEFAULT 'INCC'::text,
  created_by uuid,
  updated_by uuid,
  modalidade_id uuid,
  gestor_id uuid,
  proposta_origem_id uuid,
  ficha_completa boolean DEFAULT false,
  documentos_anexados boolean DEFAULT false,
  dados_filiacao_ok boolean DEFAULT false,
  estado_civil_validado boolean DEFAULT false,
  validacao_comercial_em timestamp with time zone,
  validacao_comercial_por uuid,
  motivo_validacao text,
  data_primeiro_atendimento timestamp with time zone,
  data_proposta_gerada timestamp with time zone,
  data_contrato_gerado timestamp with time zone,
  motivo_contra_proposta text,
  aprovada_incorporador_em timestamp with time zone,
  aprovada_incorporador_por uuid,
  atividade_origem_id uuid
);

CREATE TABLE IF NOT EXISTS public.notificacoes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  tipo text NOT NULL DEFAULT 'info'::text,
  titulo text NOT NULL,
  mensagem text NOT NULL,
  referencia_id uuid,
  referencia_tipo text,
  lida boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.planejamento_fases (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  cor text DEFAULT '#3B82F6'::text,
  ordem integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  empreendimento_id uuid
);

CREATE TABLE IF NOT EXISTS public.planejamento_historico (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL,
  user_id uuid,
  campo_alterado text NOT NULL,
  valor_anterior text,
  valor_novo text,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.planejamento_item_responsaveis (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL,
  user_id uuid NOT NULL,
  papel text DEFAULT 'responsavel'::text,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.planejamento_itens (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  empreendimento_id uuid NOT NULL,
  fase_id uuid NOT NULL,
  status_id uuid NOT NULL,
  item text NOT NULL,
  responsavel_tecnico_id uuid,
  data_inicio date,
  data_fim date,
  obs text,
  ordem integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  destaque boolean NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS public.planejamento_status (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  cor text DEFAULT '#6B7280'::text,
  ordem integer DEFAULT 0,
  is_final boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.plano_contas (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  codigo text NOT NULL,
  nome text NOT NULL,
  tipo text NOT NULL,
  categoria text NOT NULL,
  pai_id uuid,
  ordem integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  avatar_url text,
  is_active boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  percentual_comissao numeric DEFAULT 0,
  tipo_vinculo text DEFAULT 'terceiro'::text,
  cargo text
);

CREATE TABLE IF NOT EXISTS public.projeto_comentarios (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  projeto_id uuid NOT NULL,
  user_id uuid,
  comentario text NOT NULL,
  anexo_url text,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.projeto_historico (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  projeto_id uuid NOT NULL,
  user_id uuid,
  status_anterior status_projeto,
  status_novo status_projeto NOT NULL,
  observacao text,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.projeto_responsaveis (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  projeto_id uuid NOT NULL,
  user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.projetos_marketing (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  codigo text NOT NULL,
  titulo text NOT NULL,
  descricao text,
  categoria categoria_projeto NOT NULL,
  status status_projeto DEFAULT 'briefing'::status_projeto,
  prioridade prioridade_projeto DEFAULT 'media'::prioridade_projeto,
  cliente_id uuid,
  supervisor_id uuid,
  empreendimento_id uuid,
  data_solicitacao date DEFAULT CURRENT_DATE,
  data_inicio date,
  data_previsao date,
  data_entrega date,
  briefing_texto text,
  briefing_anexos jsonb DEFAULT '[]'::jsonb,
  ordem_kanban integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  ticket_etapa_id uuid,
  briefing_id uuid,
  is_interno boolean NOT NULL DEFAULT false,
  created_by uuid
);

CREATE TABLE IF NOT EXISTS public.proposta_condicoes_pagamento (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  proposta_id uuid NOT NULL,
  tipo_parcela_codigo text NOT NULL,
  quantidade integer NOT NULL DEFAULT 1,
  valor numeric NOT NULL DEFAULT 0,
  valor_tipo text,
  data_vencimento date,
  intervalo_dias integer,
  com_correcao boolean DEFAULT false,
  indice_correcao text,
  forma_pagamento text,
  descricao text,
  ordem integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.proposta_unidades (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  proposta_id uuid NOT NULL,
  unidade_id uuid NOT NULL,
  valor_tabela numeric,
  valor_proposta numeric,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.propostas (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  numero text NOT NULL DEFAULT ''::text,
  cliente_id uuid NOT NULL,
  empreendimento_id uuid NOT NULL,
  corretor_id uuid,
  imobiliaria_id uuid,
  gestor_id uuid,
  valor_tabela numeric,
  valor_proposta numeric,
  desconto_percentual numeric,
  desconto_valor numeric,
  data_emissao date DEFAULT CURRENT_DATE,
  data_validade date NOT NULL,
  status text NOT NULL DEFAULT 'rascunho'::text,
  motivo_recusa text,
  data_aceite date,
  simulacao_dados jsonb,
  observacoes text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid
);

CREATE TABLE IF NOT EXISTS public.reserva_documentos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  reserva_id uuid NOT NULL,
  tipo text NOT NULL,
  nome text NOT NULL,
  arquivo_url text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.role_permissions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  role app_role,
  module_id uuid NOT NULL,
  can_view boolean NOT NULL DEFAULT false,
  can_create boolean NOT NULL DEFAULT false,
  can_edit boolean NOT NULL DEFAULT false,
  can_delete boolean NOT NULL DEFAULT false,
  scope text NOT NULL DEFAULT 'proprio'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  role_id uuid
);

CREATE TABLE IF NOT EXISTS public.roles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  display_name text NOT NULL,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  is_system boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.saldos_mensais (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  mes integer NOT NULL,
  ano integer NOT NULL,
  saldo_inicial numeric NOT NULL DEFAULT 0,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tarefas_projeto (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  projeto_id uuid NOT NULL,
  titulo text NOT NULL,
  descricao text,
  responsavel_id uuid,
  status text DEFAULT 'pendente'::text,
  data_inicio date,
  data_fim date,
  ordem integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.template_condicoes_pagamento (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL,
  tipo_parcela_codigo text NOT NULL,
  ordem integer DEFAULT 0,
  descricao text,
  quantidade integer DEFAULT 1,
  valor numeric,
  valor_tipo text DEFAULT 'fixo'::text,
  data_vencimento date,
  intervalo_dias integer DEFAULT 30,
  evento_vencimento text,
  com_correcao boolean DEFAULT false,
  indice_correcao text DEFAULT 'INCC'::text,
  parcelas_sem_correcao integer DEFAULT 0,
  forma_quitacao text DEFAULT 'dinheiro'::text,
  forma_pagamento text DEFAULT 'boleto'::text,
  bem_descricao text,
  bem_marca text,
  bem_modelo text,
  bem_ano text,
  bem_placa text,
  bem_cor text,
  bem_renavam text,
  bem_matricula text,
  bem_cartorio text,
  bem_endereco text,
  bem_area_m2 numeric,
  bem_valor_avaliado numeric,
  bem_observacoes text,
  beneficiario_tipo text,
  beneficiario_id uuid,
  observacao_texto text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.termos_aceites (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  tipo text NOT NULL,
  versao_hash text NOT NULL,
  ip_address text,
  user_agent text,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.termos_versoes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tipo text NOT NULL,
  conteudo text NOT NULL,
  versao_hash text NOT NULL,
  criado_por uuid,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ticket_criativos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  projeto_id uuid NOT NULL,
  tipo text NOT NULL DEFAULT 'imagem'::text,
  nome text,
  url text NOT NULL,
  is_final boolean DEFAULT false,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ticket_etapas (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  cor text DEFAULT '#6b7280'::text,
  cor_bg text DEFAULT '#f3f4f6'::text,
  ordem integer DEFAULT 0,
  categoria text,
  is_inicial boolean DEFAULT false,
  is_final boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tipologias (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  empreendimento_id uuid NOT NULL,
  nome text NOT NULL,
  area_privativa numeric(10,2),
  area_total numeric(10,2),
  quartos integer DEFAULT 0,
  suites integer DEFAULT 0,
  banheiros integer DEFAULT 0,
  vagas integer DEFAULT 0,
  valor_base numeric(15,2),
  planta_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  categoria tipologia_categoria NOT NULL DEFAULT 'apartamento'::tipologia_categoria
);

CREATE TABLE IF NOT EXISTS public.tipos_atendimento_config (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  tipo_atividade text NOT NULL,
  descricao text,
  is_active boolean NOT NULL DEFAULT true,
  ordem integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tipos_parcela (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  codigo text NOT NULL,
  nome text NOT NULL,
  descricao text,
  ordem integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.unidade_historico_precos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  unidade_id uuid NOT NULL,
  valor_anterior numeric,
  valor_novo numeric,
  area_anterior numeric,
  area_nova numeric,
  motivo text,
  alterado_por uuid,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.unidades (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  empreendimento_id uuid NOT NULL,
  bloco_id uuid,
  tipologia_id uuid,
  numero text NOT NULL,
  andar integer,
  posicao text,
  area_privativa numeric(10,2),
  valor numeric(15,2),
  status unidade_status NOT NULL DEFAULT 'disponivel'::unidade_status,
  observacoes text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  polygon_coords jsonb,
  descricao text,
  fachada_id uuid,
  data_venda timestamp with time zone
);

CREATE TABLE IF NOT EXISTS public.user_empreendimentos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  empreendimento_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_module_permissions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  module_id uuid NOT NULL,
  can_view boolean NOT NULL DEFAULT false,
  can_create boolean NOT NULL DEFAULT false,
  can_edit boolean NOT NULL DEFAULT false,
  can_delete boolean NOT NULL DEFAULT false,
  scope text NOT NULL DEFAULT 'proprio'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role app_role,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  role_id uuid
);

CREATE TABLE IF NOT EXISTS public.usuario_empreendimento_bonus (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  empreendimento_id uuid NOT NULL,
  elegivel_bonificacao boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.webhook_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  webhook_id uuid,
  evento text NOT NULL,
  url text NOT NULL,
  payload jsonb,
  status_code integer,
  response_body text,
  tempo_ms integer,
  sucesso boolean NOT NULL DEFAULT false,
  erro text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.webhook_variaveis_disponiveis (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  evento text NOT NULL,
  chave text NOT NULL,
  label text NOT NULL,
  categoria text DEFAULT 'geral'::text,
  tipo text DEFAULT 'text'::text,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.webhooks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  evento text NOT NULL,
  url text NOT NULL,
  descricao text,
  is_active boolean DEFAULT true,
  ultimo_disparo timestamp with time zone,
  ultimo_status integer,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  variaveis_selecionadas text[]
);

-- 6) Constraints --------------------------------------------------------
DO $$ BEGIN ALTER TABLE public.atividade_comentarios ADD CONSTRAINT atividade_comentarios_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.atividade_etapas ADD CONSTRAINT atividade_etapas_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.atividade_historico ADD CONSTRAINT atividade_historico_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.atividade_responsaveis ADD CONSTRAINT atividade_responsaveis_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.atividades ADD CONSTRAINT atividades_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.audit_logs ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.blocos ADD CONSTRAINT blocos_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.bonificacoes ADD CONSTRAINT bonificacoes_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.boxes ADD CONSTRAINT boxes_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.briefing_referencias ADD CONSTRAINT briefing_referencias_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.briefings ADD CONSTRAINT briefings_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.categorias_fluxo ADD CONSTRAINT categorias_fluxo_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.centro_custo_empreendimentos ADD CONSTRAINT centro_custo_empreendimentos_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.centros_custo ADD CONSTRAINT centros_custo_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.cliente_interacoes ADD CONSTRAINT cliente_interacoes_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.cliente_socios ADD CONSTRAINT cliente_socios_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.cliente_telefones ADD CONSTRAINT cliente_telefones_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.clientes ADD CONSTRAINT clientes_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.comissao_parcelas ADD CONSTRAINT comissao_parcelas_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.comissoes ADD CONSTRAINT comissoes_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.configuracao_comercial ADD CONSTRAINT configuracao_comercial_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.configuracao_comissoes ADD CONSTRAINT configuracao_comissoes_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.configuracoes_sistema ADD CONSTRAINT configuracoes_sistema_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.contrato_aprovacoes ADD CONSTRAINT contrato_aprovacoes_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.contrato_condicoes_pagamento ADD CONSTRAINT contrato_condicoes_pagamento_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.contrato_documentos ADD CONSTRAINT contrato_documentos_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.contrato_pendencias ADD CONSTRAINT contrato_pendencias_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.contrato_signatarios ADD CONSTRAINT contrato_signatarios_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.contrato_template_imagens ADD CONSTRAINT contrato_template_imagens_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.contrato_templates ADD CONSTRAINT contrato_templates_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.contrato_unidades ADD CONSTRAINT contrato_unidades_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.contrato_variaveis ADD CONSTRAINT contrato_variaveis_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.contrato_versoes ADD CONSTRAINT contrato_versoes_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.contratos ADD CONSTRAINT contratos_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.corretores ADD CONSTRAINT corretores_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.empreendimento_corretores ADD CONSTRAINT empreendimento_corretores_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.empreendimento_documentos ADD CONSTRAINT empreendimento_documentos_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.empreendimento_imobiliarias ADD CONSTRAINT empreendimento_imobiliarias_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.empreendimento_midias ADD CONSTRAINT empreendimento_midias_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.empreendimentos ADD CONSTRAINT empreendimentos_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.evento_inscricoes ADD CONSTRAINT evento_inscricoes_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.evento_membros ADD CONSTRAINT evento_membros_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.evento_tarefas ADD CONSTRAINT evento_tarefas_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.evento_template_tarefas ADD CONSTRAINT evento_template_tarefas_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.evento_templates ADD CONSTRAINT evento_templates_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.eventos ADD CONSTRAINT eventos_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.fachadas ADD CONSTRAINT fachadas_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.fluxo_aprovacao_config ADD CONSTRAINT fluxo_aprovacao_config_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.funil_etapas ADD CONSTRAINT funil_etapas_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.funis ADD CONSTRAINT funis_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.google_calendar_embeds ADD CONSTRAINT google_calendar_embeds_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.imobiliarias ADD CONSTRAINT imobiliarias_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.incorporadoras ADD CONSTRAINT incorporadoras_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.lancamentos_financeiros ADD CONSTRAINT lancamentos_financeiros_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.mapa_empreendimento ADD CONSTRAINT mapa_empreendimento_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.metas_comerciais ADD CONSTRAINT metas_comerciais_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.modalidade_componentes ADD CONSTRAINT modalidade_componentes_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.modalidades_pagamento ADD CONSTRAINT modalidades_pagamento_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.modules ADD CONSTRAINT modules_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.negociacao_clientes ADD CONSTRAINT negociacao_clientes_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.negociacao_comentarios ADD CONSTRAINT negociacao_comentarios_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.negociacao_condicoes_pagamento ADD CONSTRAINT negociacao_condicoes_pagamento_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.negociacao_dacao_anexos ADD CONSTRAINT negociacao_dacao_anexos_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.negociacao_historico ADD CONSTRAINT negociacao_historico_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.negociacao_unidades ADD CONSTRAINT negociacao_unidades_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.negociacoes ADD CONSTRAINT negociacoes_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.notificacoes ADD CONSTRAINT notificacoes_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.planejamento_fases ADD CONSTRAINT planejamento_fases_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.planejamento_historico ADD CONSTRAINT planejamento_historico_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.planejamento_item_responsaveis ADD CONSTRAINT planejamento_item_responsaveis_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.planejamento_itens ADD CONSTRAINT planejamento_itens_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.planejamento_status ADD CONSTRAINT planejamento_status_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.plano_contas ADD CONSTRAINT plano_contas_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.profiles ADD CONSTRAINT profiles_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.projeto_comentarios ADD CONSTRAINT projeto_comentarios_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.projeto_historico ADD CONSTRAINT projeto_historico_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.projeto_responsaveis ADD CONSTRAINT projeto_responsaveis_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.projetos_marketing ADD CONSTRAINT projetos_marketing_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.proposta_condicoes_pagamento ADD CONSTRAINT proposta_condicoes_pagamento_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.proposta_unidades ADD CONSTRAINT proposta_unidades_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.propostas ADD CONSTRAINT propostas_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.reserva_documentos ADD CONSTRAINT reserva_documentos_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.role_permissions ADD CONSTRAINT role_permissions_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.roles ADD CONSTRAINT roles_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.saldos_mensais ADD CONSTRAINT saldos_mensais_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.tarefas_projeto ADD CONSTRAINT tarefas_projeto_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.template_condicoes_pagamento ADD CONSTRAINT template_condicoes_pagamento_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.termos_aceites ADD CONSTRAINT termos_aceites_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.termos_versoes ADD CONSTRAINT termos_versoes_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.ticket_criativos ADD CONSTRAINT ticket_criativos_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.ticket_etapas ADD CONSTRAINT ticket_etapas_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.tipologias ADD CONSTRAINT tipologias_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.tipos_atendimento_config ADD CONSTRAINT tipos_atendimento_config_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.tipos_parcela ADD CONSTRAINT tipos_parcela_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.unidade_historico_precos ADD CONSTRAINT unidade_historico_precos_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.unidades ADD CONSTRAINT unidades_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.user_empreendimentos ADD CONSTRAINT user_empreendimentos_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.user_module_permissions ADD CONSTRAINT user_module_permissions_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.usuario_empreendimento_bonus ADD CONSTRAINT usuario_empreendimento_bonus_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.webhook_logs ADD CONSTRAINT webhook_logs_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.webhook_variaveis_disponiveis ADD CONSTRAINT webhook_variaveis_disponiveis_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.webhooks ADD CONSTRAINT webhooks_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.atividade_responsaveis ADD CONSTRAINT atividade_responsaveis_unique UNIQUE (atividade_id, user_id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.boxes ADD CONSTRAINT boxes_empreendimento_numero_unique UNIQUE (empreendimento_id, numero); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.briefings ADD CONSTRAINT briefings_codigo_key UNIQUE (codigo); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.centro_custo_empreendimentos ADD CONSTRAINT centro_custo_empreendimentos_centro_custo_id_empreendimento_key UNIQUE (centro_custo_id, empreendimento_id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.cliente_socios ADD CONSTRAINT cliente_socios_cliente_id_socio_id_key UNIQUE (cliente_id, socio_id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.configuracao_comercial ADD CONSTRAINT configuracao_comercial_empreendimento_id_key UNIQUE (empreendimento_id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.configuracao_comissoes ADD CONSTRAINT unique_empreendimento_config UNIQUE (empreendimento_id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.configuracoes_sistema ADD CONSTRAINT configuracoes_sistema_chave_key UNIQUE (chave); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.contrato_signatarios ADD CONSTRAINT contrato_signatarios_token_assinatura_key UNIQUE (token_assinatura); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.contrato_unidades ADD CONSTRAINT contrato_unidades_contrato_id_unidade_id_key UNIQUE (contrato_id, unidade_id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.contrato_variaveis ADD CONSTRAINT contrato_variaveis_chave_key UNIQUE (chave); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.contratos ADD CONSTRAINT contratos_numero_key UNIQUE (numero); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.corretores ADD CONSTRAINT corretores_cod_sorteio_key UNIQUE (cod_sorteio); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.corretores ADD CONSTRAINT corretores_cpf_key UNIQUE (cpf); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.corretores ADD CONSTRAINT unique_corretor_user_id UNIQUE (user_id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.empreendimento_corretores ADD CONSTRAINT empreendimento_corretores_empreendimento_id_corretor_id_key UNIQUE (empreendimento_id, corretor_id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.empreendimento_imobiliarias ADD CONSTRAINT empreendimento_imobiliarias_empreendimento_id_imobiliaria_i_key UNIQUE (empreendimento_id, imobiliaria_id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.evento_inscricoes ADD CONSTRAINT evento_inscricoes_evento_id_user_id_key UNIQUE (evento_id, user_id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.evento_membros ADD CONSTRAINT evento_membros_evento_id_user_id_key UNIQUE (evento_id, user_id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.fluxo_aprovacao_config ADD CONSTRAINT fluxo_aprovacao_config_empreendimento_id_etapa_key UNIQUE (empreendimento_id, etapa); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.mapa_empreendimento ADD CONSTRAINT mapa_empreendimento_empreendimento_id_key UNIQUE (empreendimento_id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.modules ADD CONSTRAINT modules_name_key UNIQUE (name); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.modules ADD CONSTRAINT modules_name_unique UNIQUE (name); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.negociacao_unidades ADD CONSTRAINT negociacao_unidades_negociacao_id_unidade_id_key UNIQUE (negociacao_id, unidade_id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.negociacao_unidades ADD CONSTRAINT unique_negociacao_unidade UNIQUE (negociacao_id, unidade_id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.negociacoes ADD CONSTRAINT negociacoes_codigo_key UNIQUE (codigo); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.planejamento_item_responsaveis ADD CONSTRAINT planejamento_item_responsaveis_item_id_user_id_key UNIQUE (item_id, user_id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.plano_contas ADD CONSTRAINT plano_contas_codigo_key UNIQUE (codigo); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.projeto_responsaveis ADD CONSTRAINT projeto_responsaveis_unique UNIQUE (projeto_id, user_id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.role_permissions ADD CONSTRAINT role_permissions_role_module_id_key UNIQUE (role, module_id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.role_permissions ADD CONSTRAINT role_permissions_role_module_unique UNIQUE (role_id, module_id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.roles ADD CONSTRAINT roles_name_key UNIQUE (name); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.saldos_mensais ADD CONSTRAINT saldos_mensais_mes_ano_key UNIQUE (mes, ano); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.tipos_parcela ADD CONSTRAINT tipos_parcela_codigo_key UNIQUE (codigo); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.unidades ADD CONSTRAINT unidades_empreendimento_id_bloco_id_numero_key UNIQUE (empreendimento_id, bloco_id, numero); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.user_empreendimentos ADD CONSTRAINT user_empreendimentos_user_id_empreendimento_id_key UNIQUE (user_id, empreendimento_id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.user_module_permissions ADD CONSTRAINT user_module_permissions_user_id_module_id_key UNIQUE (user_id, module_id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_id_role_id_unique UNIQUE (user_id, role_id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_id_unique UNIQUE (user_id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.usuario_empreendimento_bonus ADD CONSTRAINT usuario_empreendimento_bonus_user_id_empreendimento_id_key UNIQUE (user_id, empreendimento_id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.webhook_variaveis_disponiveis ADD CONSTRAINT webhook_variaveis_disponiveis_evento_chave_key UNIQUE (evento, chave); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.atividades ADD CONSTRAINT atividades_categoria_check CHECK ((categoria = ANY (ARRAY['seven'::text, 'incorporadora'::text, 'imobiliaria'::text, 'cliente'::text]))); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.atividades ADD CONSTRAINT chk_atividade_datas CHECK ((data_inicio <= data_fim)); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.audit_logs ADD CONSTRAINT audit_logs_action_check CHECK ((action = ANY (ARRAY['create'::text, 'update'::text, 'delete'::text, 'login'::text, 'logout'::text]))); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.bonificacoes ADD CONSTRAINT bonificacoes_status_check CHECK ((status = ANY (ARRAY['pendente'::text, 'calculado'::text, 'pago'::text]))); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.bonificacoes ADD CONSTRAINT bonificacoes_tipo_check CHECK ((tipo = ANY (ARRAY['meta_6_meses'::text, 'meta_12_meses'::text, 'venda_mensal'::text]))); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.briefing_referencias ADD CONSTRAINT briefing_referencias_tipo_check CHECK ((tipo = ANY (ARRAY['imagem'::text, 'link'::text]))); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.categorias_fluxo ADD CONSTRAINT categorias_fluxo_tipo_check CHECK ((tipo = ANY (ARRAY['entrada'::text, 'saida'::text]))); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.cliente_socios ADD CONSTRAINT cliente_socios_check CHECK ((cliente_id <> socio_id)); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.comissao_parcelas ADD CONSTRAINT comissao_parcelas_tipo_check CHECK ((tipo = ANY (ARRAY['corretor'::text, 'imobiliaria'::text]))); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.contrato_condicoes_pagamento ADD CONSTRAINT contrato_condicoes_pagamento_beneficiario_tipo_check CHECK ((beneficiario_tipo = ANY (ARRAY['imobiliaria'::text, 'corretor'::text]))); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.contrato_condicoes_pagamento ADD CONSTRAINT contrato_condicoes_pagamento_evento_vencimento_check CHECK ((evento_vencimento = ANY (ARRAY['assinatura'::text, 'habite_se'::text, 'entrega_chaves'::text, 'custom'::text]))); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.contrato_condicoes_pagamento ADD CONSTRAINT contrato_condicoes_pagamento_forma_pagamento_check CHECK ((forma_pagamento = ANY (ARRAY['boleto'::text, 'ted'::text, 'pix'::text, 'cheque'::text, 'nota_fiscal'::text]))); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.contrato_condicoes_pagamento ADD CONSTRAINT contrato_condicoes_pagamento_forma_quitacao_check CHECK ((forma_quitacao = ANY (ARRAY['dinheiro'::text, 'veiculo'::text, 'imovel'::text, 'outro_bem'::text]))); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.contrato_condicoes_pagamento ADD CONSTRAINT contrato_condicoes_pagamento_valor_tipo_check CHECK ((valor_tipo = ANY (ARRAY['fixo'::text, 'percentual'::text]))); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.evento_inscricoes ADD CONSTRAINT evento_inscricoes_status_check CHECK ((status = ANY (ARRAY['confirmada'::text, 'cancelada'::text]))); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.lancamentos_financeiros ADD CONSTRAINT lancamentos_financeiros_beneficiario_tipo_check CHECK ((beneficiario_tipo = ANY (ARRAY['gestor'::text, 'corretor'::text, 'imobiliaria'::text, 'fornecedor'::text, 'outro'::text]))); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.lancamentos_financeiros ADD CONSTRAINT lancamentos_financeiros_status_check CHECK ((status = ANY (ARRAY['pendente'::text, 'pago'::text, 'cancelado'::text, 'vencido'::text]))); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.lancamentos_financeiros ADD CONSTRAINT lancamentos_financeiros_tipo_check CHECK ((tipo = ANY (ARRAY['pagar'::text, 'receber'::text]))); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.negociacoes ADD CONSTRAINT negociacoes_status_aprovacao_check CHECK (((status_aprovacao IS NULL) OR (status_aprovacao = ANY (ARRAY['pendente'::text, 'aprovada'::text, 'rejeitada'::text])))); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.planejamento_itens ADD CONSTRAINT check_datas CHECK (((data_fim IS NULL) OR (data_inicio IS NULL) OR (data_fim >= data_inicio))); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.plano_contas ADD CONSTRAINT plano_contas_categoria_check CHECK ((categoria = ANY (ARRAY['operacional'::text, 'financeiro'::text, 'investimento'::text]))); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.plano_contas ADD CONSTRAINT plano_contas_tipo_check CHECK ((tipo = ANY (ARRAY['receita'::text, 'despesa'::text]))); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.profiles ADD CONSTRAINT profiles_tipo_vinculo_check CHECK ((tipo_vinculo = ANY (ARRAY['funcionario_seven'::text, 'terceiro'::text]))); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.role_permissions ADD CONSTRAINT role_permissions_scope_check CHECK ((scope = ANY (ARRAY['global'::text, 'empreendimento'::text, 'proprio'::text]))); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.saldos_mensais ADD CONSTRAINT saldos_mensais_mes_check CHECK (((mes >= 1) AND (mes <= 12))); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.template_condicoes_pagamento ADD CONSTRAINT template_condicoes_pagamento_beneficiario_tipo_check CHECK ((beneficiario_tipo = ANY (ARRAY['imobiliaria'::text, 'corretor'::text]))); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.template_condicoes_pagamento ADD CONSTRAINT template_condicoes_pagamento_evento_vencimento_check CHECK ((evento_vencimento = ANY (ARRAY['assinatura'::text, 'habite_se'::text, 'entrega_chaves'::text, 'custom'::text]))); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.template_condicoes_pagamento ADD CONSTRAINT template_condicoes_pagamento_forma_pagamento_check CHECK ((forma_pagamento = ANY (ARRAY['boleto'::text, 'ted'::text, 'pix'::text, 'cheque'::text, 'nota_fiscal'::text]))); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.template_condicoes_pagamento ADD CONSTRAINT template_condicoes_pagamento_forma_quitacao_check CHECK ((forma_quitacao = ANY (ARRAY['dinheiro'::text, 'veiculo'::text, 'imovel'::text, 'outro_bem'::text]))); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.template_condicoes_pagamento ADD CONSTRAINT template_condicoes_pagamento_valor_tipo_check CHECK ((valor_tipo = ANY (ARRAY['fixo'::text, 'percentual'::text]))); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.termos_aceites ADD CONSTRAINT termos_aceites_tipo_check CHECK ((tipo = ANY (ARRAY['termos_uso'::text, 'politica_privacidade'::text]))); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.termos_versoes ADD CONSTRAINT termos_versoes_tipo_check CHECK ((tipo = ANY (ARRAY['termos_uso'::text, 'politica_privacidade'::text]))); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.atividade_comentarios ADD CONSTRAINT atividade_comentarios_atividade_id_fkey FOREIGN KEY (atividade_id) REFERENCES atividades(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.atividade_comentarios ADD CONSTRAINT atividade_comentarios_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE SET NULL; EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.atividade_historico ADD CONSTRAINT atividade_historico_atividade_id_fkey FOREIGN KEY (atividade_id) REFERENCES atividades(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.atividade_historico ADD CONSTRAINT atividade_historico_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.atividade_responsaveis ADD CONSTRAINT atividade_responsaveis_atividade_id_fkey FOREIGN KEY (atividade_id) REFERENCES atividades(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.atividade_responsaveis ADD CONSTRAINT atividade_responsaveis_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.atividades ADD CONSTRAINT atividades_atividade_etapa_id_fkey FOREIGN KEY (atividade_etapa_id) REFERENCES atividade_etapas(id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.atividades ADD CONSTRAINT atividades_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES clientes(id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.atividades ADD CONSTRAINT atividades_corretor_id_fkey FOREIGN KEY (corretor_id) REFERENCES corretores(id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.atividades ADD CONSTRAINT atividades_empreendimento_id_fkey FOREIGN KEY (empreendimento_id) REFERENCES empreendimentos(id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.atividades ADD CONSTRAINT atividades_gestor_id_fkey FOREIGN KEY (gestor_id) REFERENCES profiles(id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.atividades ADD CONSTRAINT atividades_imobiliaria_id_fkey FOREIGN KEY (imobiliaria_id) REFERENCES imobiliarias(id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.audit_logs ADD CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL; EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.blocos ADD CONSTRAINT blocos_empreendimento_id_fkey FOREIGN KEY (empreendimento_id) REFERENCES empreendimentos(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.bonificacoes ADD CONSTRAINT bonificacoes_empreendimento_id_fkey FOREIGN KEY (empreendimento_id) REFERENCES empreendimentos(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.bonificacoes ADD CONSTRAINT bonificacoes_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.boxes ADD CONSTRAINT boxes_bloco_id_fkey FOREIGN KEY (bloco_id) REFERENCES blocos(id) ON DELETE SET NULL; EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.boxes ADD CONSTRAINT boxes_empreendimento_id_fkey FOREIGN KEY (empreendimento_id) REFERENCES empreendimentos(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.boxes ADD CONSTRAINT boxes_unidade_id_fkey FOREIGN KEY (unidade_id) REFERENCES unidades(id) ON DELETE SET NULL; EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.briefing_referencias ADD CONSTRAINT briefing_referencias_briefing_id_fkey FOREIGN KEY (briefing_id) REFERENCES briefings(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.briefings ADD CONSTRAINT briefings_criado_por_fkey FOREIGN KEY (criado_por) REFERENCES auth.users(id) ON DELETE SET NULL; EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.briefings ADD CONSTRAINT briefings_empreendimento_id_fkey FOREIGN KEY (empreendimento_id) REFERENCES empreendimentos(id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.briefings ADD CONSTRAINT briefings_triado_por_fkey FOREIGN KEY (triado_por) REFERENCES auth.users(id) ON DELETE SET NULL; EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.categorias_fluxo ADD CONSTRAINT categorias_fluxo_categoria_pai_id_fkey FOREIGN KEY (categoria_pai_id) REFERENCES categorias_fluxo(id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.centro_custo_empreendimentos ADD CONSTRAINT centro_custo_empreendimentos_centro_custo_id_fkey FOREIGN KEY (centro_custo_id) REFERENCES centros_custo(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.centro_custo_empreendimentos ADD CONSTRAINT centro_custo_empreendimentos_empreendimento_id_fkey FOREIGN KEY (empreendimento_id) REFERENCES empreendimentos(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.cliente_interacoes ADD CONSTRAINT cliente_interacoes_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.cliente_interacoes ADD CONSTRAINT cliente_interacoes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL; EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.cliente_socios ADD CONSTRAINT cliente_socios_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.cliente_socios ADD CONSTRAINT cliente_socios_socio_id_fkey FOREIGN KEY (socio_id) REFERENCES clientes(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.cliente_telefones ADD CONSTRAINT cliente_telefones_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.clientes ADD CONSTRAINT clientes_conjuge_id_fkey FOREIGN KEY (conjuge_id) REFERENCES clientes(id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.clientes ADD CONSTRAINT clientes_corretor_id_fkey FOREIGN KEY (corretor_id) REFERENCES corretores(id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.clientes ADD CONSTRAINT clientes_empreendimento_id_fkey FOREIGN KEY (empreendimento_id) REFERENCES empreendimentos(id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.clientes ADD CONSTRAINT clientes_gestor_id_fkey FOREIGN KEY (gestor_id) REFERENCES profiles(id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.clientes ADD CONSTRAINT clientes_imobiliaria_id_fkey FOREIGN KEY (imobiliaria_id) REFERENCES imobiliarias(id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.comissao_parcelas ADD CONSTRAINT comissao_parcelas_comissao_id_fkey FOREIGN KEY (comissao_id) REFERENCES comissoes(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.comissoes ADD CONSTRAINT comissoes_contrato_id_fkey FOREIGN KEY (contrato_id) REFERENCES contratos(id) ON DELETE SET NULL; EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.comissoes ADD CONSTRAINT comissoes_corretor_id_fkey FOREIGN KEY (corretor_id) REFERENCES corretores(id) ON DELETE SET NULL; EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.comissoes ADD CONSTRAINT comissoes_created_by_fkey FOREIGN KEY (created_by) REFERENCES profiles(id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.comissoes ADD CONSTRAINT comissoes_empreendimento_id_fkey FOREIGN KEY (empreendimento_id) REFERENCES empreendimentos(id) ON DELETE RESTRICT; EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.comissoes ADD CONSTRAINT comissoes_gestor_id_fkey FOREIGN KEY (gestor_id) REFERENCES profiles(id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.comissoes ADD CONSTRAINT comissoes_imobiliaria_id_fkey FOREIGN KEY (imobiliaria_id) REFERENCES imobiliarias(id) ON DELETE SET NULL; EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.comissoes ADD CONSTRAINT comissoes_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES profiles(id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.configuracao_comercial ADD CONSTRAINT configuracao_comercial_empreendimento_id_fkey FOREIGN KEY (empreendimento_id) REFERENCES empreendimentos(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.configuracao_comissoes ADD CONSTRAINT configuracao_comissoes_empreendimento_id_fkey FOREIGN KEY (empreendimento_id) REFERENCES empreendimentos(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.contrato_aprovacoes ADD CONSTRAINT contrato_aprovacoes_aprovador_id_fkey FOREIGN KEY (aprovador_id) REFERENCES profiles(id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.contrato_aprovacoes ADD CONSTRAINT contrato_aprovacoes_contrato_id_fkey FOREIGN KEY (contrato_id) REFERENCES contratos(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.contrato_condicoes_pagamento ADD CONSTRAINT contrato_condicoes_pagamento_contrato_id_fkey FOREIGN KEY (contrato_id) REFERENCES contratos(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.contrato_documentos ADD CONSTRAINT contrato_documentos_contrato_id_fkey FOREIGN KEY (contrato_id) REFERENCES contratos(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.contrato_pendencias ADD CONSTRAINT contrato_pendencias_contrato_id_fkey FOREIGN KEY (contrato_id) REFERENCES contratos(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.contrato_pendencias ADD CONSTRAINT contrato_pendencias_responsavel_id_fkey FOREIGN KEY (responsavel_id) REFERENCES profiles(id) ON DELETE SET NULL; EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.contrato_signatarios ADD CONSTRAINT contrato_signatarios_contrato_id_fkey FOREIGN KEY (contrato_id) REFERENCES contratos(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.contrato_template_imagens ADD CONSTRAINT contrato_template_imagens_template_id_fkey FOREIGN KEY (template_id) REFERENCES contrato_templates(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.contrato_templates ADD CONSTRAINT contrato_templates_empreendimento_id_fkey FOREIGN KEY (empreendimento_id) REFERENCES empreendimentos(id) ON DELETE SET NULL; EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.contrato_unidades ADD CONSTRAINT contrato_unidades_contrato_id_fkey FOREIGN KEY (contrato_id) REFERENCES contratos(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.contrato_unidades ADD CONSTRAINT contrato_unidades_unidade_id_fkey FOREIGN KEY (unidade_id) REFERENCES unidades(id) ON DELETE RESTRICT; EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.contrato_versoes ADD CONSTRAINT contrato_versoes_alterado_por_fkey FOREIGN KEY (alterado_por) REFERENCES profiles(id) ON DELETE SET NULL; EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.contrato_versoes ADD CONSTRAINT contrato_versoes_contrato_id_fkey FOREIGN KEY (contrato_id) REFERENCES contratos(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.contratos ADD CONSTRAINT contratos_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE RESTRICT; EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.contratos ADD CONSTRAINT contratos_corretor_id_fkey FOREIGN KEY (corretor_id) REFERENCES corretores(id) ON DELETE SET NULL; EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.contratos ADD CONSTRAINT contratos_created_by_fkey FOREIGN KEY (created_by) REFERENCES profiles(id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.contratos ADD CONSTRAINT contratos_empreendimento_id_fkey FOREIGN KEY (empreendimento_id) REFERENCES empreendimentos(id) ON DELETE RESTRICT; EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.contratos ADD CONSTRAINT contratos_gestor_id_fkey FOREIGN KEY (gestor_id) REFERENCES profiles(id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.contratos ADD CONSTRAINT contratos_imobiliaria_id_fkey FOREIGN KEY (imobiliaria_id) REFERENCES imobiliarias(id) ON DELETE SET NULL; EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.contratos ADD CONSTRAINT contratos_modalidade_id_fkey FOREIGN KEY (modalidade_id) REFERENCES modalidades_pagamento(id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.contratos ADD CONSTRAINT contratos_negociacao_id_fkey FOREIGN KEY (negociacao_id) REFERENCES negociacoes(id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.contratos ADD CONSTRAINT contratos_template_id_fkey FOREIGN KEY (template_id) REFERENCES contrato_templates(id) ON DELETE SET NULL; EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.contratos ADD CONSTRAINT contratos_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES profiles(id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.corretores ADD CONSTRAINT corretores_imobiliaria_id_fkey FOREIGN KEY (imobiliaria_id) REFERENCES imobiliarias(id) ON DELETE SET NULL; EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.corretores ADD CONSTRAINT corretores_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL; EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.empreendimento_corretores ADD CONSTRAINT empreendimento_corretores_autorizado_por_fkey FOREIGN KEY (autorizado_por) REFERENCES profiles(id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.empreendimento_corretores ADD CONSTRAINT empreendimento_corretores_corretor_id_fkey FOREIGN KEY (corretor_id) REFERENCES corretores(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.empreendimento_corretores ADD CONSTRAINT empreendimento_corretores_empreendimento_id_fkey FOREIGN KEY (empreendimento_id) REFERENCES empreendimentos(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.empreendimento_documentos ADD CONSTRAINT empreendimento_documentos_created_by_fkey FOREIGN KEY (created_by) REFERENCES profiles(id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.empreendimento_documentos ADD CONSTRAINT empreendimento_documentos_empreendimento_id_fkey FOREIGN KEY (empreendimento_id) REFERENCES empreendimentos(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.empreendimento_imobiliarias ADD CONSTRAINT empreendimento_imobiliarias_autorizado_por_fkey FOREIGN KEY (autorizado_por) REFERENCES profiles(id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.empreendimento_imobiliarias ADD CONSTRAINT empreendimento_imobiliarias_empreendimento_id_fkey FOREIGN KEY (empreendimento_id) REFERENCES empreendimentos(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.empreendimento_imobiliarias ADD CONSTRAINT empreendimento_imobiliarias_imobiliaria_id_fkey FOREIGN KEY (imobiliaria_id) REFERENCES imobiliarias(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.empreendimento_midias ADD CONSTRAINT empreendimento_midias_empreendimento_id_fkey FOREIGN KEY (empreendimento_id) REFERENCES empreendimentos(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.empreendimentos ADD CONSTRAINT empreendimentos_incorporadora_id_fkey FOREIGN KEY (incorporadora_id) REFERENCES incorporadoras(id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.empreendimentos ADD CONSTRAINT empreendimentos_responsavel_comercial_id_fkey FOREIGN KEY (responsavel_comercial_id) REFERENCES profiles(id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.evento_inscricoes ADD CONSTRAINT evento_inscricoes_corretor_id_fkey FOREIGN KEY (corretor_id) REFERENCES corretores(id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.evento_inscricoes ADD CONSTRAINT evento_inscricoes_evento_id_fkey FOREIGN KEY (evento_id) REFERENCES eventos(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.evento_inscricoes ADD CONSTRAINT evento_inscricoes_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.evento_membros ADD CONSTRAINT evento_membros_evento_id_fkey FOREIGN KEY (evento_id) REFERENCES eventos(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.evento_membros ADD CONSTRAINT evento_membros_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.evento_tarefas ADD CONSTRAINT evento_tarefas_dependencia_id_fkey FOREIGN KEY (dependencia_id) REFERENCES evento_tarefas(id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.evento_tarefas ADD CONSTRAINT evento_tarefas_evento_id_fkey FOREIGN KEY (evento_id) REFERENCES eventos(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.evento_tarefas ADD CONSTRAINT evento_tarefas_responsavel_id_fkey FOREIGN KEY (responsavel_id) REFERENCES profiles(id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.evento_template_tarefas ADD CONSTRAINT evento_template_tarefas_template_id_fkey FOREIGN KEY (template_id) REFERENCES evento_templates(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.eventos ADD CONSTRAINT eventos_created_by_fkey FOREIGN KEY (created_by) REFERENCES profiles(id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.eventos ADD CONSTRAINT eventos_empreendimento_id_fkey FOREIGN KEY (empreendimento_id) REFERENCES empreendimentos(id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.eventos ADD CONSTRAINT eventos_responsavel_id_fkey FOREIGN KEY (responsavel_id) REFERENCES profiles(id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.fachadas ADD CONSTRAINT fachadas_empreendimento_id_fkey FOREIGN KEY (empreendimento_id) REFERENCES empreendimentos(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.fluxo_aprovacao_config ADD CONSTRAINT fluxo_aprovacao_config_empreendimento_id_fkey FOREIGN KEY (empreendimento_id) REFERENCES empreendimentos(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.funil_etapas ADD CONSTRAINT funil_etapas_funil_id_fkey FOREIGN KEY (funil_id) REFERENCES funis(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.funis ADD CONSTRAINT funis_empreendimento_id_fkey FOREIGN KEY (empreendimento_id) REFERENCES empreendimentos(id) ON DELETE SET NULL; EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.google_calendar_embeds ADD CONSTRAINT google_calendar_embeds_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.imobiliarias ADD CONSTRAINT imobiliarias_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL; EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.lancamentos_financeiros ADD CONSTRAINT lancamentos_financeiros_beneficiario_id_fkey FOREIGN KEY (beneficiario_id) REFERENCES profiles(id) ON DELETE SET NULL; EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.lancamentos_financeiros ADD CONSTRAINT lancamentos_financeiros_bonificacao_id_fkey FOREIGN KEY (bonificacao_id) REFERENCES bonificacoes(id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.lancamentos_financeiros ADD CONSTRAINT lancamentos_financeiros_centro_custo_id_fkey FOREIGN KEY (centro_custo_id) REFERENCES centros_custo(id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.lancamentos_financeiros ADD CONSTRAINT lancamentos_financeiros_comissao_id_fkey FOREIGN KEY (comissao_id) REFERENCES comissoes(id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.lancamentos_financeiros ADD CONSTRAINT lancamentos_financeiros_conferido_por_fkey FOREIGN KEY (conferido_por) REFERENCES profiles(id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.lancamentos_financeiros ADD CONSTRAINT lancamentos_financeiros_conta_id_fkey FOREIGN KEY (conta_id) REFERENCES plano_contas(id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.lancamentos_financeiros ADD CONSTRAINT lancamentos_financeiros_contrato_id_fkey FOREIGN KEY (contrato_id) REFERENCES contratos(id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.lancamentos_financeiros ADD CONSTRAINT lancamentos_financeiros_created_by_fkey FOREIGN KEY (created_by) REFERENCES profiles(id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.lancamentos_financeiros ADD CONSTRAINT lancamentos_financeiros_empreendimento_id_fkey FOREIGN KEY (empreendimento_id) REFERENCES empreendimentos(id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.lancamentos_financeiros ADD CONSTRAINT lancamentos_financeiros_recorrencia_pai_id_fkey FOREIGN KEY (recorrencia_pai_id) REFERENCES lancamentos_financeiros(id) ON DELETE SET NULL; EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.mapa_empreendimento ADD CONSTRAINT mapa_empreendimento_empreendimento_id_fkey FOREIGN KEY (empreendimento_id) REFERENCES empreendimentos(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.metas_comerciais ADD CONSTRAINT metas_comerciais_corretor_id_fkey FOREIGN KEY (corretor_id) REFERENCES corretores(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.metas_comerciais ADD CONSTRAINT metas_comerciais_empreendimento_id_fkey FOREIGN KEY (empreendimento_id) REFERENCES empreendimentos(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.metas_comerciais ADD CONSTRAINT metas_comerciais_gestor_id_fkey FOREIGN KEY (gestor_id) REFERENCES profiles(id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.modalidade_componentes ADD CONSTRAINT modalidade_componentes_modalidade_id_fkey FOREIGN KEY (modalidade_id) REFERENCES modalidades_pagamento(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.modalidades_pagamento ADD CONSTRAINT modalidades_pagamento_empreendimento_id_fkey FOREIGN KEY (empreendimento_id) REFERENCES empreendimentos(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.negociacao_clientes ADD CONSTRAINT negociacao_clientes_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES clientes(id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.negociacao_clientes ADD CONSTRAINT negociacao_clientes_negociacao_id_fkey FOREIGN KEY (negociacao_id) REFERENCES negociacoes(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.negociacao_comentarios ADD CONSTRAINT fk_negociacao_comentarios_user_id FOREIGN KEY (user_id) REFERENCES profiles(id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.negociacao_comentarios ADD CONSTRAINT negociacao_comentarios_negociacao_id_fkey FOREIGN KEY (negociacao_id) REFERENCES negociacoes(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.negociacao_comentarios ADD CONSTRAINT negociacao_comentarios_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.negociacao_condicoes_pagamento ADD CONSTRAINT negociacao_condicoes_pagamento_negociacao_id_fkey FOREIGN KEY (negociacao_id) REFERENCES negociacoes(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.negociacao_dacao_anexos ADD CONSTRAINT negociacao_dacao_anexos_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.negociacao_dacao_anexos ADD CONSTRAINT negociacao_dacao_anexos_negociacao_id_fkey FOREIGN KEY (negociacao_id) REFERENCES negociacoes(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.negociacao_historico ADD CONSTRAINT negociacao_historico_funil_etapa_anterior_id_fkey FOREIGN KEY (funil_etapa_anterior_id) REFERENCES funil_etapas(id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.negociacao_historico ADD CONSTRAINT negociacao_historico_funil_etapa_nova_id_fkey FOREIGN KEY (funil_etapa_nova_id) REFERENCES funil_etapas(id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.negociacao_historico ADD CONSTRAINT negociacao_historico_negociacao_id_fkey FOREIGN KEY (negociacao_id) REFERENCES negociacoes(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.negociacao_historico ADD CONSTRAINT negociacao_historico_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.negociacao_unidades ADD CONSTRAINT negociacao_unidades_negociacao_id_fkey FOREIGN KEY (negociacao_id) REFERENCES negociacoes(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.negociacao_unidades ADD CONSTRAINT negociacao_unidades_unidade_id_fkey FOREIGN KEY (unidade_id) REFERENCES unidades(id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.negociacoes ADD CONSTRAINT negociacoes_atividade_origem_id_fkey FOREIGN KEY (atividade_origem_id) REFERENCES atividades(id) ON DELETE SET NULL; EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.negociacoes ADD CONSTRAINT negociacoes_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES clientes(id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.negociacoes ADD CONSTRAINT negociacoes_contrato_id_fkey FOREIGN KEY (contrato_id) REFERENCES contratos(id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.negociacoes ADD CONSTRAINT negociacoes_corretor_id_fkey FOREIGN KEY (corretor_id) REFERENCES corretores(id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.negociacoes ADD CONSTRAINT negociacoes_created_by_fkey FOREIGN KEY (created_by) REFERENCES profiles(id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.negociacoes ADD CONSTRAINT negociacoes_empreendimento_id_fkey FOREIGN KEY (empreendimento_id) REFERENCES empreendimentos(id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.negociacoes ADD CONSTRAINT negociacoes_funil_etapa_id_fkey FOREIGN KEY (funil_etapa_id) REFERENCES funil_etapas(id) ON DELETE SET NULL; EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.negociacoes ADD CONSTRAINT negociacoes_gestor_id_fkey FOREIGN KEY (gestor_id) REFERENCES profiles(id) ON DELETE SET NULL; EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.negociacoes ADD CONSTRAINT negociacoes_imobiliaria_id_fkey FOREIGN KEY (imobiliaria_id) REFERENCES imobiliarias(id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.negociacoes ADD CONSTRAINT negociacoes_modalidade_id_fkey FOREIGN KEY (modalidade_id) REFERENCES modalidades_pagamento(id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.negociacoes ADD CONSTRAINT negociacoes_proposta_origem_id_fkey FOREIGN KEY (proposta_origem_id) REFERENCES propostas(id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.negociacoes ADD CONSTRAINT negociacoes_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES profiles(id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.negociacoes ADD CONSTRAINT negociacoes_validacao_comercial_por_fkey FOREIGN KEY (validacao_comercial_por) REFERENCES profiles(id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.notificacoes ADD CONSTRAINT notificacoes_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.planejamento_fases ADD CONSTRAINT planejamento_fases_empreendimento_id_fkey FOREIGN KEY (empreendimento_id) REFERENCES empreendimentos(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.planejamento_historico ADD CONSTRAINT planejamento_historico_item_id_fkey FOREIGN KEY (item_id) REFERENCES planejamento_itens(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.planejamento_historico ADD CONSTRAINT planejamento_historico_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.planejamento_item_responsaveis ADD CONSTRAINT planejamento_item_responsaveis_item_id_fkey FOREIGN KEY (item_id) REFERENCES planejamento_itens(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.planejamento_item_responsaveis ADD CONSTRAINT planejamento_item_responsaveis_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.planejamento_itens ADD CONSTRAINT planejamento_itens_created_by_fkey FOREIGN KEY (created_by) REFERENCES profiles(id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.planejamento_itens ADD CONSTRAINT planejamento_itens_empreendimento_id_fkey FOREIGN KEY (empreendimento_id) REFERENCES empreendimentos(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.planejamento_itens ADD CONSTRAINT planejamento_itens_fase_id_fkey FOREIGN KEY (fase_id) REFERENCES planejamento_fases(id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.planejamento_itens ADD CONSTRAINT planejamento_itens_responsavel_tecnico_id_fkey FOREIGN KEY (responsavel_tecnico_id) REFERENCES profiles(id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.planejamento_itens ADD CONSTRAINT planejamento_itens_status_id_fkey FOREIGN KEY (status_id) REFERENCES planejamento_status(id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.plano_contas ADD CONSTRAINT plano_contas_pai_id_fkey FOREIGN KEY (pai_id) REFERENCES plano_contas(id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.profiles ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.projeto_comentarios ADD CONSTRAINT projeto_comentarios_projeto_id_fkey FOREIGN KEY (projeto_id) REFERENCES projetos_marketing(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.projeto_comentarios ADD CONSTRAINT projeto_comentarios_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.projeto_historico ADD CONSTRAINT projeto_historico_projeto_id_fkey FOREIGN KEY (projeto_id) REFERENCES projetos_marketing(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.projeto_historico ADD CONSTRAINT projeto_historico_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.projeto_responsaveis ADD CONSTRAINT projeto_responsaveis_projeto_id_fkey FOREIGN KEY (projeto_id) REFERENCES projetos_marketing(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.projeto_responsaveis ADD CONSTRAINT projeto_responsaveis_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.projetos_marketing ADD CONSTRAINT fk_projetos_marketing_created_by FOREIGN KEY (created_by) REFERENCES profiles(id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.projetos_marketing ADD CONSTRAINT projetos_marketing_briefing_id_fkey FOREIGN KEY (briefing_id) REFERENCES briefings(id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.projetos_marketing ADD CONSTRAINT projetos_marketing_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES profiles(id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.projetos_marketing ADD CONSTRAINT projetos_marketing_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL; EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.projetos_marketing ADD CONSTRAINT projetos_marketing_empreendimento_id_fkey FOREIGN KEY (empreendimento_id) REFERENCES empreendimentos(id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.projetos_marketing ADD CONSTRAINT projetos_marketing_supervisor_id_fkey FOREIGN KEY (supervisor_id) REFERENCES profiles(id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.projetos_marketing ADD CONSTRAINT projetos_marketing_ticket_etapa_id_fkey FOREIGN KEY (ticket_etapa_id) REFERENCES ticket_etapas(id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.proposta_condicoes_pagamento ADD CONSTRAINT proposta_condicoes_pagamento_proposta_id_fkey FOREIGN KEY (proposta_id) REFERENCES propostas(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.proposta_unidades ADD CONSTRAINT proposta_unidades_proposta_id_fkey FOREIGN KEY (proposta_id) REFERENCES propostas(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.proposta_unidades ADD CONSTRAINT proposta_unidades_unidade_id_fkey FOREIGN KEY (unidade_id) REFERENCES unidades(id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.propostas ADD CONSTRAINT propostas_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES clientes(id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.propostas ADD CONSTRAINT propostas_corretor_id_fkey FOREIGN KEY (corretor_id) REFERENCES corretores(id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.propostas ADD CONSTRAINT propostas_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL; EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.propostas ADD CONSTRAINT propostas_empreendimento_id_fkey FOREIGN KEY (empreendimento_id) REFERENCES empreendimentos(id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.propostas ADD CONSTRAINT propostas_gestor_id_fkey FOREIGN KEY (gestor_id) REFERENCES profiles(id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.propostas ADD CONSTRAINT propostas_imobiliaria_id_fkey FOREIGN KEY (imobiliaria_id) REFERENCES imobiliarias(id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.propostas ADD CONSTRAINT propostas_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id) ON DELETE SET NULL; EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.role_permissions ADD CONSTRAINT role_permissions_module_id_fkey FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.role_permissions ADD CONSTRAINT role_permissions_role_id_fkey FOREIGN KEY (role_id) REFERENCES roles(id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.saldos_mensais ADD CONSTRAINT saldos_mensais_created_by_fkey FOREIGN KEY (created_by) REFERENCES profiles(id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.tarefas_projeto ADD CONSTRAINT tarefas_projeto_projeto_id_fkey FOREIGN KEY (projeto_id) REFERENCES projetos_marketing(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.tarefas_projeto ADD CONSTRAINT tarefas_projeto_responsavel_id_fkey FOREIGN KEY (responsavel_id) REFERENCES profiles(id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.template_condicoes_pagamento ADD CONSTRAINT template_condicoes_pagamento_template_id_fkey FOREIGN KEY (template_id) REFERENCES contrato_templates(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.termos_aceites ADD CONSTRAINT termos_aceites_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.termos_versoes ADD CONSTRAINT termos_versoes_criado_por_fkey FOREIGN KEY (criado_por) REFERENCES auth.users(id) ON DELETE SET NULL; EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.ticket_criativos ADD CONSTRAINT ticket_criativos_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL; EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.ticket_criativos ADD CONSTRAINT ticket_criativos_projeto_id_fkey FOREIGN KEY (projeto_id) REFERENCES projetos_marketing(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.tipologias ADD CONSTRAINT tipologias_empreendimento_id_fkey FOREIGN KEY (empreendimento_id) REFERENCES empreendimentos(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.unidade_historico_precos ADD CONSTRAINT unidade_historico_precos_alterado_por_fkey FOREIGN KEY (alterado_por) REFERENCES auth.users(id) ON DELETE SET NULL; EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.unidade_historico_precos ADD CONSTRAINT unidade_historico_precos_unidade_id_fkey FOREIGN KEY (unidade_id) REFERENCES unidades(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.unidades ADD CONSTRAINT unidades_bloco_id_fkey FOREIGN KEY (bloco_id) REFERENCES blocos(id) ON DELETE SET NULL; EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.unidades ADD CONSTRAINT unidades_empreendimento_id_fkey FOREIGN KEY (empreendimento_id) REFERENCES empreendimentos(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.unidades ADD CONSTRAINT unidades_fachada_id_fkey FOREIGN KEY (fachada_id) REFERENCES fachadas(id) ON DELETE SET NULL; EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.unidades ADD CONSTRAINT unidades_tipologia_id_fkey FOREIGN KEY (tipologia_id) REFERENCES tipologias(id) ON DELETE SET NULL; EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.user_empreendimentos ADD CONSTRAINT user_empreendimentos_empreendimento_id_fkey FOREIGN KEY (empreendimento_id) REFERENCES empreendimentos(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.user_empreendimentos ADD CONSTRAINT user_empreendimentos_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.user_module_permissions ADD CONSTRAINT user_module_permissions_module_id_fkey FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.user_module_permissions ADD CONSTRAINT user_module_permissions_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_role_id_fkey FOREIGN KEY (role_id) REFERENCES roles(id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.usuario_empreendimento_bonus ADD CONSTRAINT usuario_empreendimento_bonus_empreendimento_id_fkey FOREIGN KEY (empreendimento_id) REFERENCES empreendimentos(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.usuario_empreendimento_bonus ADD CONSTRAINT usuario_empreendimento_bonus_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.webhook_logs ADD CONSTRAINT webhook_logs_webhook_id_fkey FOREIGN KEY (webhook_id) REFERENCES webhooks(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; WHEN others THEN NULL; END $$;

-- 7) Índices ------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_atividade_comentarios_atividade ON public.atividade_comentarios USING btree (atividade_id);
CREATE INDEX IF NOT EXISTS idx_atividade_historico_atividade ON public.atividade_historico USING btree (atividade_id);
CREATE INDEX IF NOT EXISTS idx_atividade_historico_created ON public.atividade_historico USING btree (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_atividades_created_by ON public.atividades USING btree (created_by);
CREATE INDEX IF NOT EXISTS idx_atividades_deadline_date ON public.atividades USING btree (deadline_date);
CREATE INDEX IF NOT EXISTS idx_atividades_gestor_id ON public.atividades USING btree (gestor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs USING btree (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON public.audit_logs USING btree (table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_blocos_empreendimento ON public.blocos USING btree (empreendimento_id);
CREATE INDEX IF NOT EXISTS idx_boxes_empreendimento ON public.boxes USING btree (empreendimento_id);
CREATE INDEX IF NOT EXISTS idx_boxes_status ON public.boxes USING btree (status);
CREATE INDEX IF NOT EXISTS idx_boxes_unidade ON public.boxes USING btree (unidade_id);
CREATE INDEX IF NOT EXISTS idx_briefings_created_at ON public.briefings USING btree (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_briefings_criado_por ON public.briefings USING btree (criado_por);
CREATE INDEX IF NOT EXISTS idx_briefings_empreendimento ON public.briefings USING btree (empreendimento_id);
CREATE INDEX IF NOT EXISTS idx_briefings_status ON public.briefings USING btree (status);
CREATE INDEX IF NOT EXISTS idx_cliente_interacoes_cliente ON public.cliente_interacoes USING btree (cliente_id);
CREATE INDEX IF NOT EXISTS idx_cliente_socios_cliente_id ON public.cliente_socios USING btree (cliente_id);
CREATE INDEX IF NOT EXISTS idx_cliente_socios_socio_id ON public.cliente_socios USING btree (socio_id);
CREATE INDEX IF NOT EXISTS idx_cliente_telefones_cliente ON public.cliente_telefones USING btree (cliente_id);
CREATE INDEX IF NOT EXISTS idx_clientes_conjuge_id ON public.clientes USING btree (conjuge_id);
CREATE INDEX IF NOT EXISTS idx_clientes_empreendimento ON public.clientes USING btree (empreendimento_id);
CREATE INDEX IF NOT EXISTS idx_clientes_fase ON public.clientes USING btree (fase);
CREATE INDEX IF NOT EXISTS idx_clientes_imobiliaria ON public.clientes USING btree (imobiliaria_id);
CREATE INDEX IF NOT EXISTS idx_clientes_lead_id ON public.clientes USING btree (lead_id);
CREATE INDEX IF NOT EXISTS idx_clientes_temperatura ON public.clientes USING btree (temperatura);
CREATE INDEX IF NOT EXISTS idx_comissao_parcelas_comissao ON public.comissao_parcelas USING btree (comissao_id);
CREATE INDEX IF NOT EXISTS idx_comissao_parcelas_status ON public.comissao_parcelas USING btree (status);
CREATE INDEX IF NOT EXISTS idx_comissao_parcelas_vencimento ON public.comissao_parcelas USING btree (data_vencimento);
CREATE INDEX IF NOT EXISTS idx_comissoes_contrato ON public.comissoes USING btree (contrato_id);
CREATE INDEX IF NOT EXISTS idx_comissoes_corretor ON public.comissoes USING btree (corretor_id);
CREATE INDEX IF NOT EXISTS idx_comissoes_empreendimento ON public.comissoes USING btree (empreendimento_id);
CREATE INDEX IF NOT EXISTS idx_comissoes_imobiliaria ON public.comissoes USING btree (imobiliaria_id);
CREATE INDEX IF NOT EXISTS idx_comissoes_status_corretor ON public.comissoes USING btree (status_corretor);
CREATE INDEX IF NOT EXISTS idx_comissoes_status_imobiliaria ON public.comissoes USING btree (status_imobiliaria);
CREATE INDEX IF NOT EXISTS idx_contrato_aprovacoes_aprovador ON public.contrato_aprovacoes USING btree (aprovador_id);
CREATE INDEX IF NOT EXISTS idx_contrato_aprovacoes_contrato ON public.contrato_aprovacoes USING btree (contrato_id);
CREATE INDEX IF NOT EXISTS idx_contrato_documentos_contrato ON public.contrato_documentos USING btree (contrato_id);
CREATE INDEX IF NOT EXISTS idx_contrato_pendencias_contrato ON public.contrato_pendencias USING btree (contrato_id);
CREATE INDEX IF NOT EXISTS idx_contrato_signatarios_contrato ON public.contrato_signatarios USING btree (contrato_id);
CREATE INDEX IF NOT EXISTS idx_contrato_signatarios_status ON public.contrato_signatarios USING btree (status);
CREATE INDEX IF NOT EXISTS idx_contrato_signatarios_token ON public.contrato_signatarios USING btree (token_assinatura);
CREATE INDEX IF NOT EXISTS idx_contrato_unidades_contrato ON public.contrato_unidades USING btree (contrato_id);
CREATE INDEX IF NOT EXISTS idx_contrato_versoes_contrato ON public.contrato_versoes USING btree (contrato_id);
CREATE INDEX IF NOT EXISTS idx_contratos_cliente ON public.contratos USING btree (cliente_id);
CREATE INDEX IF NOT EXISTS idx_contratos_corretor ON public.contratos USING btree (corretor_id);
CREATE INDEX IF NOT EXISTS idx_contratos_empreendimento ON public.contratos USING btree (empreendimento_id);
CREATE INDEX IF NOT EXISTS idx_contratos_gestor_id ON public.contratos USING btree (gestor_id);
CREATE INDEX IF NOT EXISTS idx_contratos_modalidade ON public.contratos USING btree (modalidade_id);
CREATE INDEX IF NOT EXISTS idx_contratos_negociacao ON public.contratos USING btree (negociacao_id);
CREATE INDEX IF NOT EXISTS idx_contratos_status ON public.contratos USING btree (status);
CREATE INDEX IF NOT EXISTS idx_corretores_user_id ON public.corretores USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_empreendimentos_cidade ON public.empreendimentos USING btree (endereco_cidade);
CREATE INDEX IF NOT EXISTS idx_empreendimentos_status ON public.empreendimentos USING btree (status);
CREATE INDEX IF NOT EXISTS idx_empreendimentos_tipo ON public.empreendimentos USING btree (tipo);
CREATE INDEX IF NOT EXISTS idx_fachadas_empreendimento_id ON public.fachadas USING btree (empreendimento_id);
CREATE INDEX IF NOT EXISTS idx_fluxo_aprovacao_config_empreendimento ON public.fluxo_aprovacao_config USING btree (empreendimento_id);
CREATE INDEX IF NOT EXISTS idx_funil_etapas_funil ON public.funil_etapas USING btree (funil_id);
CREATE INDEX IF NOT EXISTS idx_funil_etapas_ordem ON public.funil_etapas USING btree (funil_id, ordem);
CREATE INDEX IF NOT EXISTS idx_funis_default ON public.funis USING btree (is_default) WHERE (is_default = true);
CREATE INDEX IF NOT EXISTS idx_funis_empreendimento ON public.funis USING btree (empreendimento_id);
CREATE INDEX IF NOT EXISTS idx_incorporadoras_cnpj ON public.incorporadoras USING btree (cnpj);
CREATE INDEX IF NOT EXISTS idx_incorporadoras_is_active ON public.incorporadoras USING btree (is_active);
CREATE INDEX IF NOT EXISTS idx_incorporadoras_nome ON public.incorporadoras USING btree (nome);
CREATE INDEX IF NOT EXISTS idx_lancamentos_beneficiario ON public.lancamentos_financeiros USING btree (beneficiario_id);
CREATE INDEX IF NOT EXISTS idx_lancamentos_recorrencia_pai ON public.lancamentos_financeiros USING btree (recorrencia_pai_id) WHERE (recorrencia_pai_id IS NOT NULL);
CREATE INDEX IF NOT EXISTS idx_mapa_empreendimento_empreendimento_id ON public.mapa_empreendimento USING btree (empreendimento_id);
CREATE INDEX IF NOT EXISTS idx_componentes_modalidade ON public.modalidade_componentes USING btree (modalidade_id);
CREATE INDEX IF NOT EXISTS idx_modalidades_empreendimento ON public.modalidades_pagamento USING btree (empreendimento_id);
CREATE INDEX IF NOT EXISTS idx_modules_category ON public.modules USING btree (category);
CREATE INDEX IF NOT EXISTS idx_negociacao_clientes_cliente_id ON public.negociacao_clientes USING btree (cliente_id);
CREATE INDEX IF NOT EXISTS idx_negociacao_clientes_negociacao_id ON public.negociacao_clientes USING btree (negociacao_id);
CREATE INDEX IF NOT EXISTS idx_negociacao_condicoes_pagamento_negociacao_id ON public.negociacao_condicoes_pagamento USING btree (negociacao_id);
CREATE INDEX IF NOT EXISTS idx_negociacao_historico_etapa_anterior ON public.negociacao_historico USING btree (funil_etapa_anterior_id);
CREATE INDEX IF NOT EXISTS idx_negociacao_historico_etapa_nova ON public.negociacao_historico USING btree (funil_etapa_nova_id);
CREATE INDEX IF NOT EXISTS idx_negociacoes_contrato_id ON public.negociacoes USING btree (contrato_id);
CREATE INDEX IF NOT EXISTS idx_negociacoes_data_validade_proposta ON public.negociacoes USING btree (data_validade_proposta);
CREATE INDEX IF NOT EXISTS idx_negociacoes_funil_etapa ON public.negociacoes USING btree (funil_etapa_id);
CREATE INDEX IF NOT EXISTS idx_negociacoes_gestor_id ON public.negociacoes USING btree (gestor_id);
CREATE INDEX IF NOT EXISTS idx_negociacoes_modalidade ON public.negociacoes USING btree (modalidade_id);
CREATE INDEX IF NOT EXISTS idx_negociacoes_proposta_origem_id ON public.negociacoes USING btree (proposta_origem_id);
CREATE INDEX IF NOT EXISTS idx_negociacoes_status_proposta ON public.negociacoes USING btree (status_proposta);
CREATE INDEX IF NOT EXISTS idx_notificacoes_created_at ON public.notificacoes USING btree (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notificacoes_user_lida ON public.notificacoes USING btree (user_id, lida);
CREATE INDEX IF NOT EXISTS idx_planejamento_fases_empreendimento ON public.planejamento_fases USING btree (empreendimento_id);
CREATE INDEX IF NOT EXISTS idx_planejamento_historico_item ON public.planejamento_historico USING btree (item_id);
CREATE INDEX IF NOT EXISTS idx_planejamento_item_responsaveis_item_id ON public.planejamento_item_responsaveis USING btree (item_id);
CREATE INDEX IF NOT EXISTS idx_planejamento_item_responsaveis_user_id ON public.planejamento_item_responsaveis USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_planejamento_itens_datas ON public.planejamento_itens USING btree (data_inicio, data_fim);
CREATE INDEX IF NOT EXISTS idx_planejamento_itens_empreendimento ON public.planejamento_itens USING btree (empreendimento_id);
CREATE INDEX IF NOT EXISTS idx_planejamento_itens_fase ON public.planejamento_itens USING btree (fase_id);
CREATE INDEX IF NOT EXISTS idx_planejamento_itens_responsavel ON public.planejamento_itens USING btree (responsavel_tecnico_id);
CREATE INDEX IF NOT EXISTS idx_planejamento_itens_status ON public.planejamento_itens USING btree (status_id);
CREATE INDEX IF NOT EXISTS idx_profiles_tipo_vinculo ON public.profiles USING btree (tipo_vinculo);
CREATE INDEX IF NOT EXISTS idx_projeto_responsaveis_projeto ON public.projeto_responsaveis USING btree (projeto_id);
CREATE INDEX IF NOT EXISTS idx_projeto_responsaveis_user ON public.projeto_responsaveis USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_projetos_marketing_briefing_id ON public.projetos_marketing USING btree (briefing_id);
CREATE INDEX IF NOT EXISTS idx_proposta_condicoes_proposta ON public.proposta_condicoes_pagamento USING btree (proposta_id);
CREATE INDEX IF NOT EXISTS idx_proposta_unidades_proposta ON public.proposta_unidades USING btree (proposta_id);
CREATE INDEX IF NOT EXISTS idx_propostas_cliente ON public.propostas USING btree (cliente_id);
CREATE INDEX IF NOT EXISTS idx_propostas_empreendimento ON public.propostas USING btree (empreendimento_id);
CREATE INDEX IF NOT EXISTS idx_propostas_is_active ON public.propostas USING btree (is_active);
CREATE INDEX IF NOT EXISTS idx_propostas_status ON public.propostas USING btree (status);
CREATE INDEX IF NOT EXISTS idx_reserva_documentos_reserva ON public.reserva_documentos USING btree (reserva_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_module_id ON public.role_permissions USING btree (module_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON public.role_permissions USING btree (role);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON public.role_permissions USING btree (role_id);
CREATE INDEX IF NOT EXISTS idx_termos_aceites_created ON public.termos_aceites USING btree (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_termos_aceites_user ON public.termos_aceites USING btree (user_id, tipo);
CREATE INDEX IF NOT EXISTS idx_termos_aceites_versao ON public.termos_aceites USING btree (versao_hash);
CREATE INDEX IF NOT EXISTS idx_termos_versoes_hash ON public.termos_versoes USING btree (versao_hash);
CREATE INDEX IF NOT EXISTS idx_termos_versoes_tipo ON public.termos_versoes USING btree (tipo, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ticket_criativos_projeto ON public.ticket_criativos USING btree (projeto_id);
CREATE INDEX IF NOT EXISTS idx_ticket_etapas_categoria ON public.ticket_etapas USING btree (categoria);
CREATE INDEX IF NOT EXISTS idx_ticket_etapas_ordem ON public.ticket_etapas USING btree (ordem);
CREATE INDEX IF NOT EXISTS idx_tipologias_empreendimento ON public.tipologias USING btree (empreendimento_id);
CREATE INDEX IF NOT EXISTS idx_historico_precos_data ON public.unidade_historico_precos USING btree (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_historico_precos_unidade ON public.unidade_historico_precos USING btree (unidade_id);
CREATE INDEX IF NOT EXISTS idx_unidades_bloco ON public.unidades USING btree (bloco_id);
CREATE INDEX IF NOT EXISTS idx_unidades_empreendimento ON public.unidades USING btree (empreendimento_id);
CREATE INDEX IF NOT EXISTS idx_unidades_fachada_id ON public.unidades USING btree (fachada_id);
CREATE INDEX IF NOT EXISTS idx_unidades_status ON public.unidades USING btree (status);
CREATE INDEX IF NOT EXISTS idx_user_empreendimentos_user_id ON public.user_empreendimentos USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_user_module_permissions_user_id ON public.user_module_permissions USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_created_at ON public.webhook_logs USING btree (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_evento ON public.webhook_logs USING btree (evento);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_webhook_id ON public.webhook_logs USING btree (webhook_id);

-- 8) Triggers -----------------------------------------------------------
CREATE OR REPLACE TRIGGER audit_blocos AFTER INSERT OR DELETE OR UPDATE ON public.blocos FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
CREATE OR REPLACE TRIGGER audit_clientes AFTER INSERT OR DELETE OR UPDATE ON public.clientes FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
CREATE OR REPLACE TRIGGER audit_comissao_parcelas AFTER INSERT OR DELETE OR UPDATE ON public.comissao_parcelas FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
CREATE OR REPLACE TRIGGER audit_comissoes AFTER INSERT OR DELETE OR UPDATE ON public.comissoes FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
CREATE OR REPLACE TRIGGER audit_configuracao_comercial AFTER INSERT OR DELETE OR UPDATE ON public.configuracao_comercial FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
CREATE OR REPLACE TRIGGER audit_configuracao_comissoes AFTER INSERT OR DELETE OR UPDATE ON public.configuracao_comissoes FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
CREATE OR REPLACE TRIGGER audit_contrato_documentos AFTER INSERT OR DELETE OR UPDATE ON public.contrato_documentos FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
CREATE OR REPLACE TRIGGER audit_contrato_pendencias AFTER INSERT OR DELETE OR UPDATE ON public.contrato_pendencias FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
CREATE OR REPLACE TRIGGER audit_contrato_templates AFTER INSERT OR DELETE OR UPDATE ON public.contrato_templates FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
CREATE OR REPLACE TRIGGER audit_contrato_unidades AFTER INSERT OR DELETE OR UPDATE ON public.contrato_unidades FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
CREATE OR REPLACE TRIGGER audit_contrato_versoes AFTER INSERT OR DELETE OR UPDATE ON public.contrato_versoes FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
CREATE OR REPLACE TRIGGER audit_contratos AFTER INSERT OR DELETE OR UPDATE ON public.contratos FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
CREATE OR REPLACE TRIGGER audit_corretores AFTER INSERT OR DELETE OR UPDATE ON public.corretores FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
CREATE OR REPLACE TRIGGER audit_empreendimento_corretores AFTER INSERT OR DELETE OR UPDATE ON public.empreendimento_corretores FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
CREATE OR REPLACE TRIGGER audit_empreendimento_documentos AFTER INSERT OR DELETE OR UPDATE ON public.empreendimento_documentos FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
CREATE OR REPLACE TRIGGER audit_empreendimento_imobiliarias AFTER INSERT OR DELETE OR UPDATE ON public.empreendimento_imobiliarias FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
CREATE OR REPLACE TRIGGER audit_empreendimento_midias AFTER INSERT OR DELETE OR UPDATE ON public.empreendimento_midias FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
CREATE OR REPLACE TRIGGER audit_empreendimentos AFTER INSERT OR DELETE OR UPDATE ON public.empreendimentos FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
CREATE OR REPLACE TRIGGER audit_funil_etapas AFTER INSERT OR DELETE OR UPDATE ON public.funil_etapas FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
CREATE OR REPLACE TRIGGER audit_funis AFTER INSERT OR DELETE OR UPDATE ON public.funis FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
CREATE OR REPLACE TRIGGER audit_imobiliarias AFTER INSERT OR DELETE OR UPDATE ON public.imobiliarias FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
CREATE OR REPLACE TRIGGER audit_mapa_empreendimento AFTER INSERT OR DELETE OR UPDATE ON public.mapa_empreendimento FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
CREATE OR REPLACE TRIGGER audit_modules AFTER INSERT OR DELETE OR UPDATE ON public.modules FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
CREATE OR REPLACE TRIGGER audit_negociacao_historico AFTER INSERT OR DELETE OR UPDATE ON public.negociacao_historico FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
CREATE OR REPLACE TRIGGER audit_negociacao_unidades AFTER INSERT OR DELETE OR UPDATE ON public.negociacao_unidades FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
CREATE OR REPLACE TRIGGER audit_negociacoes AFTER INSERT OR DELETE OR UPDATE ON public.negociacoes FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
CREATE OR REPLACE TRIGGER audit_profiles AFTER INSERT OR DELETE OR UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
CREATE OR REPLACE TRIGGER audit_reserva_documentos AFTER INSERT OR DELETE OR UPDATE ON public.reserva_documentos FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
CREATE OR REPLACE TRIGGER audit_role_permissions AFTER INSERT OR DELETE OR UPDATE ON public.role_permissions FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
CREATE OR REPLACE TRIGGER audit_tipologias AFTER INSERT OR DELETE OR UPDATE ON public.tipologias FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
CREATE OR REPLACE TRIGGER audit_unidades AFTER INSERT OR DELETE OR UPDATE ON public.unidades FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
CREATE OR REPLACE TRIGGER audit_user_empreendimentos AFTER INSERT OR DELETE OR UPDATE ON public.user_empreendimentos FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
CREATE OR REPLACE TRIGGER audit_user_roles AFTER INSERT OR DELETE OR UPDATE ON public.user_roles FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
CREATE OR REPLACE TRIGGER check_negociacao_proposta_expiracao_trigger BEFORE UPDATE ON public.negociacoes FOR EACH ROW EXECUTE FUNCTION check_negociacao_proposta_expiracao();
CREATE OR REPLACE TRIGGER generate_negociacao_codigo_trigger BEFORE INSERT ON public.negociacoes FOR EACH ROW EXECUTE FUNCTION generate_negociacao_codigo();
CREATE OR REPLACE TRIGGER manage_negociacao_proposta_unidades_status_trigger AFTER UPDATE ON public.negociacoes FOR EACH ROW EXECUTE FUNCTION manage_negociacao_proposta_unidades_status();
CREATE OR REPLACE TRIGGER planejamento_audit_trigger BEFORE UPDATE ON public.planejamento_itens FOR EACH ROW EXECUTE FUNCTION log_planejamento_changes();
CREATE OR REPLACE TRIGGER set_briefing_codigo BEFORE INSERT ON public.briefings FOR EACH ROW WHEN (((new.codigo IS NULL) OR (new.codigo = ''::text))) EXECUTE FUNCTION generate_briefing_codigo();
CREATE OR REPLACE TRIGGER set_comissao_numero BEFORE INSERT ON public.comissoes FOR EACH ROW EXECUTE FUNCTION generate_comissao_numero();
CREATE OR REPLACE TRIGGER set_evento_codigo BEFORE INSERT ON public.eventos FOR EACH ROW EXECUTE FUNCTION generate_evento_codigo();
CREATE OR REPLACE TRIGGER set_projeto_codigo BEFORE INSERT ON public.projetos_marketing FOR EACH ROW EXECUTE FUNCTION generate_projeto_codigo();
CREATE OR REPLACE TRIGGER set_proposta_numero BEFORE INSERT ON public.propostas FOR EACH ROW EXECUTE FUNCTION generate_proposta_numero();
CREATE OR REPLACE TRIGGER tr_ensure_single_principal_telefone BEFORE INSERT OR UPDATE ON public.cliente_telefones FOR EACH ROW EXECUTE FUNCTION ensure_single_principal_telefone();
CREATE OR REPLACE TRIGGER trg_atividade_insert_historico AFTER INSERT ON public.atividades FOR EACH ROW EXECUTE FUNCTION log_atividade_criacao();
CREATE OR REPLACE TRIGGER trg_atividade_update_historico AFTER UPDATE ON public.atividades FOR EACH ROW EXECUTE FUNCTION log_atividade_alteracao();
CREATE OR REPLACE TRIGGER trg_auto_set_gestor_id_atividades BEFORE INSERT ON public.atividades FOR EACH ROW EXECUTE FUNCTION auto_set_gestor_id_atividades();
CREATE OR REPLACE TRIGGER trg_auto_set_gestor_id_clientes BEFORE INSERT ON public.clientes FOR EACH ROW EXECUTE FUNCTION auto_set_gestor_id_clientes();
CREATE OR REPLACE TRIGGER trg_set_atividade_created_by BEFORE INSERT ON public.atividades FOR EACH ROW EXECUTE FUNCTION set_atividade_created_by();
CREATE OR REPLACE TRIGGER trg_set_cod_sorteio BEFORE INSERT ON public.corretores FOR EACH ROW EXECUTE FUNCTION set_cod_sorteio();
CREATE OR REPLACE TRIGGER trg_set_data_venda BEFORE UPDATE ON public.unidades FOR EACH ROW EXECUTE FUNCTION set_data_venda();
CREATE OR REPLACE TRIGGER trg_sync_user_role_enum BEFORE INSERT OR UPDATE ON public.user_roles FOR EACH ROW EXECUTE FUNCTION sync_user_role_enum();
CREATE OR REPLACE TRIGGER trigger_atualizar_ficha_completa BEFORE UPDATE ON public.negociacoes FOR EACH ROW EXECUTE FUNCTION atualizar_ficha_completa();
CREATE OR REPLACE TRIGGER trigger_generate_contrato_numero BEFORE INSERT ON public.contratos FOR EACH ROW EXECUTE FUNCTION generate_contrato_numero();
CREATE OR REPLACE TRIGGER trigger_liberar_unidades_cancelamento AFTER UPDATE ON public.negociacoes FOR EACH ROW WHEN ((old.status_aprovacao IS DISTINCT FROM new.status_aprovacao)) EXECUTE FUNCTION liberar_unidades_negociacao_cancelada();
CREATE OR REPLACE TRIGGER trigger_prevent_gestor_id_change BEFORE UPDATE ON public.atividades FOR EACH ROW EXECUTE FUNCTION prevent_gestor_id_change();
CREATE OR REPLACE TRIGGER trigger_uppercase_blocos BEFORE INSERT OR UPDATE ON public.blocos FOR EACH ROW EXECUTE FUNCTION uppercase_blocos();
CREATE OR REPLACE TRIGGER trigger_uppercase_clientes BEFORE INSERT OR UPDATE ON public.clientes FOR EACH ROW EXECUTE FUNCTION uppercase_clientes();
CREATE OR REPLACE TRIGGER trigger_uppercase_corretores BEFORE INSERT OR UPDATE ON public.corretores FOR EACH ROW EXECUTE FUNCTION uppercase_corretores();
CREATE OR REPLACE TRIGGER trigger_uppercase_empreendimentos BEFORE INSERT OR UPDATE ON public.empreendimentos FOR EACH ROW EXECUTE FUNCTION uppercase_empreendimentos();
CREATE OR REPLACE TRIGGER trigger_uppercase_imobiliarias BEFORE INSERT OR UPDATE ON public.imobiliarias FOR EACH ROW EXECUTE FUNCTION uppercase_imobiliarias();
CREATE OR REPLACE TRIGGER trigger_uppercase_incorporadoras BEFORE INSERT OR UPDATE ON public.incorporadoras FOR EACH ROW EXECUTE FUNCTION uppercase_incorporadoras();
CREATE OR REPLACE TRIGGER trigger_uppercase_tipologias BEFORE INSERT OR UPDATE ON public.tipologias FOR EACH ROW EXECUTE FUNCTION uppercase_tipologias();
CREATE OR REPLACE TRIGGER trigger_validate_conjuge BEFORE INSERT OR UPDATE ON public.contrato_signatarios FOR EACH ROW EXECUTE FUNCTION validate_conjuge_data();
CREATE OR REPLACE TRIGGER update_atividade_etapas_updated_at BEFORE UPDATE ON public.atividade_etapas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_atividades_updated_at BEFORE UPDATE ON public.atividades FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_blocos_updated_at BEFORE UPDATE ON public.blocos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_bonificacoes_updated_at BEFORE UPDATE ON public.bonificacoes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_boxes_updated_at BEFORE UPDATE ON public.boxes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_briefings_updated_at BEFORE UPDATE ON public.briefings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_clientes_updated_at BEFORE UPDATE ON public.clientes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_comissao_parcelas_updated_at BEFORE UPDATE ON public.comissao_parcelas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_comissoes_updated_at BEFORE UPDATE ON public.comissoes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_configuracao_comercial_updated_at BEFORE UPDATE ON public.configuracao_comercial FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_configuracao_comissoes_updated_at BEFORE UPDATE ON public.configuracao_comissoes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_configuracoes_sistema_updated_at BEFORE UPDATE ON public.configuracoes_sistema FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_contrato_aprovacoes_updated_at BEFORE UPDATE ON public.contrato_aprovacoes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_contrato_condicoes_pagamento_updated_at BEFORE UPDATE ON public.contrato_condicoes_pagamento FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_contrato_documentos_updated_at BEFORE UPDATE ON public.contrato_documentos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_contrato_pendencias_updated_at BEFORE UPDATE ON public.contrato_pendencias FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_contrato_signatarios_updated_at BEFORE UPDATE ON public.contrato_signatarios FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_contrato_templates_updated_at BEFORE UPDATE ON public.contrato_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_contrato_variaveis_updated_at BEFORE UPDATE ON public.contrato_variaveis FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_contratos_updated_at BEFORE UPDATE ON public.contratos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_corretores_updated_at BEFORE UPDATE ON public.corretores FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_empreendimentos_updated_at BEFORE UPDATE ON public.empreendimentos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_evento_tarefas_updated_at BEFORE UPDATE ON public.evento_tarefas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_evento_templates_updated_at BEFORE UPDATE ON public.evento_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_eventos_updated_at BEFORE UPDATE ON public.eventos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_fachadas_updated_at BEFORE UPDATE ON public.fachadas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_fluxo_aprovacao_config_updated_at BEFORE UPDATE ON public.fluxo_aprovacao_config FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_funis_updated_at BEFORE UPDATE ON public.funis FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_imobiliarias_updated_at BEFORE UPDATE ON public.imobiliarias FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_incorporadoras_updated_at BEFORE UPDATE ON public.incorporadoras FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_lancamentos_updated_at BEFORE UPDATE ON public.lancamentos_financeiros FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_mapa_empreendimento_updated_at BEFORE UPDATE ON public.mapa_empreendimento FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_metas_comerciais_updated_at BEFORE UPDATE ON public.metas_comerciais FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_modalidades_pagamento_updated_at BEFORE UPDATE ON public.modalidades_pagamento FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_negociacao_condicoes_pagamento_updated_at BEFORE UPDATE ON public.negociacao_condicoes_pagamento FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_negociacoes_updated_at BEFORE UPDATE ON public.negociacoes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_planejamento_fases_updated_at BEFORE UPDATE ON public.planejamento_fases FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_planejamento_status_updated_at BEFORE UPDATE ON public.planejamento_status FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_projetos_marketing_updated_at BEFORE UPDATE ON public.projetos_marketing FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_propostas_updated_at BEFORE UPDATE ON public.propostas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_roles_updated_at BEFORE UPDATE ON public.roles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_tarefas_projeto_updated_at BEFORE UPDATE ON public.tarefas_projeto FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_template_condicoes_pagamento_updated_at BEFORE UPDATE ON public.template_condicoes_pagamento FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_ticket_criativos_updated_at BEFORE UPDATE ON public.ticket_criativos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_ticket_etapas_updated_at BEFORE UPDATE ON public.ticket_etapas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_tipologias_updated_at BEFORE UPDATE ON public.tipologias FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_tipos_atendimento_config_updated_at BEFORE UPDATE ON public.tipos_atendimento_config FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_unidades_updated_at BEFORE UPDATE ON public.unidades FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_user_module_permissions_updated_at BEFORE UPDATE ON public.user_module_permissions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_webhooks_updated_at BEFORE UPDATE ON public.webhooks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 9) RLS habilitada -----------------------------------------------------
ALTER TABLE public.atividade_comentarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atividade_etapas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atividade_historico ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atividade_responsaveis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atividades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bonificacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.briefing_referencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.briefings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorias_fluxo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.centro_custo_empreendimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.centros_custo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cliente_interacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cliente_socios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cliente_telefones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comissao_parcelas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comissoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracao_comercial ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracao_comissoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracoes_sistema ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contrato_aprovacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contrato_condicoes_pagamento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contrato_documentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contrato_pendencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contrato_signatarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contrato_template_imagens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contrato_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contrato_unidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contrato_variaveis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contrato_versoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contratos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.corretores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.empreendimento_corretores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.empreendimento_documentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.empreendimento_imobiliarias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.empreendimento_midias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.empreendimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evento_inscricoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evento_membros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evento_tarefas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evento_template_tarefas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evento_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eventos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fachadas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fluxo_aprovacao_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funil_etapas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.google_calendar_embeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.imobiliarias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incorporadoras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lancamentos_financeiros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mapa_empreendimento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metas_comerciais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modalidade_componentes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modalidades_pagamento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.negociacao_clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.negociacao_comentarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.negociacao_condicoes_pagamento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.negociacao_dacao_anexos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.negociacao_historico ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.negociacao_unidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.negociacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planejamento_fases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planejamento_historico ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planejamento_item_responsaveis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planejamento_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planejamento_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plano_contas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projeto_comentarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projeto_historico ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projeto_responsaveis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projetos_marketing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposta_condicoes_pagamento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposta_unidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.propostas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reserva_documentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saldos_mensais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tarefas_projeto ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_condicoes_pagamento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.termos_aceites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.termos_versoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_criativos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_etapas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tipologias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tipos_atendimento_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tipos_parcela ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unidade_historico_precos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_empreendimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_module_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuario_empreendimento_bonus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_variaveis_disponiveis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;

-- 10) Policies RLS ------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated users can create comments" ON public.atividade_comentarios;
CREATE POLICY "Authenticated users can create comments" ON public.atividade_comentarios AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));
DROP POLICY IF EXISTS "Authenticated users can view comments" ON public.atividade_comentarios;
CREATE POLICY "Authenticated users can view comments" ON public.atividade_comentarios AS PERMISSIVE FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Admins gerenciam atividade_etapas" ON public.atividade_etapas;
CREATE POLICY "Admins gerenciam atividade_etapas" ON public.atividade_etapas AS PERMISSIVE FOR ALL TO public USING (is_admin(auth.uid()));
DROP POLICY IF EXISTS "Leitura publica atividade_etapas" ON public.atividade_etapas;
CREATE POLICY "Leitura publica atividade_etapas" ON public.atividade_etapas AS PERMISSIVE FOR SELECT TO public USING (true);
DROP POLICY IF EXISTS "Authenticated users can read historico" ON public.atividade_historico;
CREATE POLICY "Authenticated users can read historico" ON public.atividade_historico AS PERMISSIVE FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Authenticated users can delete atividade_responsaveis" ON public.atividade_responsaveis;
CREATE POLICY "Authenticated users can delete atividade_responsaveis" ON public.atividade_responsaveis AS PERMISSIVE FOR DELETE TO authenticated USING (true);
DROP POLICY IF EXISTS "Authenticated users can insert atividade_responsaveis" ON public.atividade_responsaveis;
CREATE POLICY "Authenticated users can insert atividade_responsaveis" ON public.atividade_responsaveis AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Authenticated users can view atividade_responsaveis" ON public.atividade_responsaveis;
CREATE POLICY "Authenticated users can view atividade_responsaveis" ON public.atividade_responsaveis AS PERMISSIVE FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Admins can manage atividades" ON public.atividades;
CREATE POLICY "Admins can manage atividades" ON public.atividades AS PERMISSIVE FOR ALL TO public USING (is_admin(auth.uid()));
DROP POLICY IF EXISTS "Gestores can delete own atividades" ON public.atividades;
CREATE POLICY "Gestores can delete own atividades" ON public.atividades AS PERMISSIVE FOR DELETE TO public USING ((has_role(auth.uid(), 'gestor_produto'::text) AND (gestor_id = auth.uid())));
DROP POLICY IF EXISTS "Gestores can insert atividades" ON public.atividades;
CREATE POLICY "Gestores can insert atividades" ON public.atividades AS PERMISSIVE FOR INSERT TO public WITH CHECK ((has_role(auth.uid(), 'gestor_produto'::text) AND (gestor_id = auth.uid())));
DROP POLICY IF EXISTS "Gestores can update own atividades" ON public.atividades;
CREATE POLICY "Gestores can update own atividades" ON public.atividades AS PERMISSIVE FOR UPDATE TO public USING ((has_role(auth.uid(), 'gestor_produto'::text) AND (gestor_id = auth.uid())));
DROP POLICY IF EXISTS "Gestores can view own atividades" ON public.atividades;
CREATE POLICY "Gestores can view own atividades" ON public.atividades AS PERMISSIVE FOR SELECT TO public USING ((has_role(auth.uid(), 'gestor_produto'::text) AND (gestor_id = auth.uid())));
DROP POLICY IF EXISTS "Incorporadores can view atividades of their empreendimentos" ON public.atividades;
CREATE POLICY "Incorporadores can view atividades of their empreendimentos" ON public.atividades AS PERMISSIVE FOR SELECT TO authenticated USING ((is_incorporador(auth.uid()) AND (empreendimento_id IN ( SELECT user_empreendimentos.empreendimento_id
   FROM user_empreendimentos
  WHERE (user_empreendimentos.user_id = auth.uid())))));
DROP POLICY IF EXISTS "Users can create atividades" ON public.atividades;
CREATE POLICY "Users can create atividades" ON public.atividades AS PERMISSIVE FOR INSERT TO public WITH CHECK (true);
DROP POLICY IF EXISTS "Users can update own atividades" ON public.atividades;
CREATE POLICY "Users can update own atividades" ON public.atividades AS PERMISSIVE FOR UPDATE TO authenticated USING (((gestor_id = auth.uid()) OR (created_by = auth.uid()) OR (corretor_id IN ( SELECT get_corretor_ids_by_user(auth.uid()) AS get_corretor_ids_by_user))));
DROP POLICY IF EXISTS "Users can view own atividades" ON public.atividades;
CREATE POLICY "Users can view own atividades" ON public.atividades AS PERMISSIVE FOR SELECT TO authenticated USING (((gestor_id = auth.uid()) OR (created_by = auth.uid()) OR (corretor_id IN ( SELECT get_corretor_ids_by_user(auth.uid()) AS get_corretor_ids_by_user))));
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_logs;
CREATE POLICY "Admins can view audit logs" ON public.audit_logs AS PERMISSIVE FOR SELECT TO authenticated USING (is_admin(auth.uid()));
DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;
CREATE POLICY "System can insert audit logs" ON public.audit_logs AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Admins can manage blocos" ON public.blocos;
CREATE POLICY "Admins can manage blocos" ON public.blocos AS PERMISSIVE FOR ALL TO public USING (is_admin(auth.uid()));
DROP POLICY IF EXISTS "Gestores can manage blocos" ON public.blocos;
CREATE POLICY "Gestores can manage blocos" ON public.blocos AS PERMISSIVE FOR ALL TO public USING (has_role(auth.uid(), 'gestor_produto'::app_role));
DROP POLICY IF EXISTS "Users can view blocos of authorized empreendimentos" ON public.blocos;
CREATE POLICY "Users can view blocos of authorized empreendimentos" ON public.blocos AS PERMISSIVE FOR SELECT TO public USING (user_has_empreendimento_access(auth.uid(), empreendimento_id));
DROP POLICY IF EXISTS "Admins can manage bonificacoes" ON public.bonificacoes;
CREATE POLICY "Admins can manage bonificacoes" ON public.bonificacoes AS PERMISSIVE FOR ALL TO public USING (is_admin(auth.uid()));
DROP POLICY IF EXISTS "Gestores can view own bonificacoes" ON public.bonificacoes;
CREATE POLICY "Gestores can view own bonificacoes" ON public.bonificacoes AS PERMISSIVE FOR SELECT TO public USING (((user_id = auth.uid()) OR has_role(auth.uid(), 'gestor_produto'::app_role)));
DROP POLICY IF EXISTS boxes_delete_policy ON public.boxes;
CREATE POLICY boxes_delete_policy ON public.boxes AS PERMISSIVE FOR DELETE TO public USING (is_admin(auth.uid()));
DROP POLICY IF EXISTS boxes_insert_policy ON public.boxes;
CREATE POLICY boxes_insert_policy ON public.boxes AS PERMISSIVE FOR INSERT TO public WITH CHECK ((is_admin(auth.uid()) OR has_role(auth.uid(), 'gestor_produto'::text)));
DROP POLICY IF EXISTS boxes_select_policy ON public.boxes;
CREATE POLICY boxes_select_policy ON public.boxes AS PERMISSIVE FOR SELECT TO public USING ((is_admin(auth.uid()) OR has_role(auth.uid(), 'gestor_produto'::text) OR user_has_empreendimento_access(auth.uid(), empreendimento_id)));
DROP POLICY IF EXISTS boxes_update_policy ON public.boxes;
CREATE POLICY boxes_update_policy ON public.boxes AS PERMISSIVE FOR UPDATE TO public USING ((is_admin(auth.uid()) OR has_role(auth.uid(), 'gestor_produto'::text))) WITH CHECK ((is_admin(auth.uid()) OR has_role(auth.uid(), 'gestor_produto'::text)));
DROP POLICY IF EXISTS "Authenticated users can manage briefing_referencias" ON public.briefing_referencias;
CREATE POLICY "Authenticated users can manage briefing_referencias" ON public.briefing_referencias AS PERMISSIVE FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Admins can delete briefings" ON public.briefings;
CREATE POLICY "Admins can delete briefings" ON public.briefings AS PERMISSIVE FOR DELETE TO public USING (is_admin(auth.uid()));
DROP POLICY IF EXISTS "Incorporadores can update own pending briefings" ON public.briefings;
CREATE POLICY "Incorporadores can update own pending briefings" ON public.briefings AS PERMISSIVE FOR UPDATE TO public USING (((criado_por = auth.uid()) AND (status = 'pendente'::briefing_status)));
DROP POLICY IF EXISTS "Incorporadores can view own briefings" ON public.briefings;
CREATE POLICY "Incorporadores can view own briefings" ON public.briefings AS PERMISSIVE FOR SELECT TO public USING ((criado_por = auth.uid()));
DROP POLICY IF EXISTS "Seven team can update all briefings" ON public.briefings;
CREATE POLICY "Seven team can update all briefings" ON public.briefings AS PERMISSIVE FOR UPDATE TO public USING ((is_seven_team(auth.uid()) OR is_admin(auth.uid())));
DROP POLICY IF EXISTS "Seven team can view all briefings" ON public.briefings;
CREATE POLICY "Seven team can view all briefings" ON public.briefings AS PERMISSIVE FOR SELECT TO public USING ((is_seven_team(auth.uid()) OR is_admin(auth.uid())));
DROP POLICY IF EXISTS "Users can create briefings" ON public.briefings;
CREATE POLICY "Users can create briefings" ON public.briefings AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = criado_por));
DROP POLICY IF EXISTS "Admins can manage categorias_fluxo" ON public.categorias_fluxo;
CREATE POLICY "Admins can manage categorias_fluxo" ON public.categorias_fluxo AS PERMISSIVE FOR ALL TO public USING (is_admin(auth.uid()));
DROP POLICY IF EXISTS "Gestores can manage categorias_fluxo" ON public.categorias_fluxo;
CREATE POLICY "Gestores can manage categorias_fluxo" ON public.categorias_fluxo AS PERMISSIVE FOR ALL TO public USING (has_role(auth.uid(), 'gestor_produto'::app_role));
DROP POLICY IF EXISTS "Users can view categorias_fluxo" ON public.categorias_fluxo;
CREATE POLICY "Users can view categorias_fluxo" ON public.categorias_fluxo AS PERMISSIVE FOR SELECT TO public USING (true);
DROP POLICY IF EXISTS "Admins can manage centro_custo_empreendimentos" ON public.centro_custo_empreendimentos;
CREATE POLICY "Admins can manage centro_custo_empreendimentos" ON public.centro_custo_empreendimentos AS PERMISSIVE FOR ALL TO public USING (is_admin(auth.uid()));
DROP POLICY IF EXISTS "Gestores can manage centro_custo_empreendimentos" ON public.centro_custo_empreendimentos;
CREATE POLICY "Gestores can manage centro_custo_empreendimentos" ON public.centro_custo_empreendimentos AS PERMISSIVE FOR ALL TO public USING (has_role(auth.uid(), 'gestor_produto'::app_role));
DROP POLICY IF EXISTS "Users can view centro_custo_empreendimentos" ON public.centro_custo_empreendimentos;
CREATE POLICY "Users can view centro_custo_empreendimentos" ON public.centro_custo_empreendimentos AS PERMISSIVE FOR SELECT TO public USING (user_has_empreendimento_access(auth.uid(), empreendimento_id));
DROP POLICY IF EXISTS "Admins can manage centros_custo" ON public.centros_custo;
CREATE POLICY "Admins can manage centros_custo" ON public.centros_custo AS PERMISSIVE FOR ALL TO public USING (is_admin(auth.uid()));
DROP POLICY IF EXISTS "Gestores can manage centros_custo" ON public.centros_custo;
CREATE POLICY "Gestores can manage centros_custo" ON public.centros_custo AS PERMISSIVE FOR ALL TO public USING (has_role(auth.uid(), 'gestor_produto'::app_role));
DROP POLICY IF EXISTS "Users can view centros_custo" ON public.centros_custo;
CREATE POLICY "Users can view centros_custo" ON public.centros_custo AS PERMISSIVE FOR SELECT TO public USING (true);
DROP POLICY IF EXISTS "Admins can manage cliente_interacoes" ON public.cliente_interacoes;
CREATE POLICY "Admins can manage cliente_interacoes" ON public.cliente_interacoes AS PERMISSIVE FOR ALL TO public USING (is_admin(auth.uid()));
DROP POLICY IF EXISTS "Gestores can manage cliente_interacoes" ON public.cliente_interacoes;
CREATE POLICY "Gestores can manage cliente_interacoes" ON public.cliente_interacoes AS PERMISSIVE FOR ALL TO public USING (has_role(auth.uid(), 'gestor_produto'::app_role));
DROP POLICY IF EXISTS "Users can insert cliente_interacoes" ON public.cliente_interacoes;
CREATE POLICY "Users can insert cliente_interacoes" ON public.cliente_interacoes AS PERMISSIVE FOR INSERT TO public WITH CHECK (true);
DROP POLICY IF EXISTS "Users can view cliente_interacoes" ON public.cliente_interacoes;
CREATE POLICY "Users can view cliente_interacoes" ON public.cliente_interacoes AS PERMISSIVE FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM clientes c
  WHERE ((c.id = cliente_interacoes.cliente_id) AND (is_admin(auth.uid()) OR has_role(auth.uid(), 'gestor_produto'::text) OR (c.corretor_id IN ( SELECT get_corretor_ids_by_user(auth.uid()) AS get_corretor_ids_by_user)))))));
DROP POLICY IF EXISTS "Usuarios logados podem atualizar socios" ON public.cliente_socios;
CREATE POLICY "Usuarios logados podem atualizar socios" ON public.cliente_socios AS PERMISSIVE FOR UPDATE TO public USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));
DROP POLICY IF EXISTS "Usuarios logados podem inserir socios" ON public.cliente_socios;
CREATE POLICY "Usuarios logados podem inserir socios" ON public.cliente_socios AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() IS NOT NULL));
DROP POLICY IF EXISTS "Usuarios logados podem remover socios" ON public.cliente_socios;
CREATE POLICY "Usuarios logados podem remover socios" ON public.cliente_socios AS PERMISSIVE FOR DELETE TO public USING ((auth.uid() IS NOT NULL));
DROP POLICY IF EXISTS "Usuarios logados podem ver socios" ON public.cliente_socios;
CREATE POLICY "Usuarios logados podem ver socios" ON public.cliente_socios AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() IS NOT NULL));
DROP POLICY IF EXISTS "Authenticated users can delete telefones" ON public.cliente_telefones;
CREATE POLICY "Authenticated users can delete telefones" ON public.cliente_telefones AS PERMISSIVE FOR DELETE TO authenticated USING (true);
DROP POLICY IF EXISTS "Authenticated users can insert telefones" ON public.cliente_telefones;
CREATE POLICY "Authenticated users can insert telefones" ON public.cliente_telefones AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Authenticated users can update telefones" ON public.cliente_telefones;
CREATE POLICY "Authenticated users can update telefones" ON public.cliente_telefones AS PERMISSIVE FOR UPDATE TO authenticated USING (true);
DROP POLICY IF EXISTS "Authenticated users can view telefones" ON public.cliente_telefones;
CREATE POLICY "Authenticated users can view telefones" ON public.cliente_telefones AS PERMISSIVE FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Admins can manage clientes" ON public.clientes;
CREATE POLICY "Admins can manage clientes" ON public.clientes AS PERMISSIVE FOR ALL TO public USING (is_admin(auth.uid()));
DROP POLICY IF EXISTS "Authenticated users can create clientes" ON public.clientes;
CREATE POLICY "Authenticated users can create clientes" ON public.clientes AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (((corretor_id IS NULL) OR (corretor_id IN ( SELECT c.id
   FROM corretores c
  WHERE (c.user_id = auth.uid()))) OR is_admin(auth.uid()) OR has_role(auth.uid(), 'gestor_produto'::text) OR is_gestor_imobiliaria(auth.uid()) OR has_role(auth.uid(), 'corretor'::text)));
DROP POLICY IF EXISTS "Corretores can update own clientes" ON public.clientes;
CREATE POLICY "Corretores can update own clientes" ON public.clientes AS PERMISSIVE FOR UPDATE TO authenticated USING ((corretor_id IN ( SELECT get_corretor_ids_by_user(auth.uid()) AS get_corretor_ids_by_user)));
DROP POLICY IF EXISTS "Corretores can view clientes" ON public.clientes;
CREATE POLICY "Corretores can view clientes" ON public.clientes AS PERMISSIVE FOR SELECT TO authenticated USING ((corretor_id IN ( SELECT get_corretor_ids_by_user(auth.uid()) AS get_corretor_ids_by_user)));
DROP POLICY IF EXISTS "Gestores can delete own clientes" ON public.clientes;
CREATE POLICY "Gestores can delete own clientes" ON public.clientes AS PERMISSIVE FOR DELETE TO public USING ((has_role(auth.uid(), 'gestor_produto'::text) AND (gestor_id = auth.uid())));
DROP POLICY IF EXISTS "Gestores can insert clientes" ON public.clientes;
CREATE POLICY "Gestores can insert clientes" ON public.clientes AS PERMISSIVE FOR INSERT TO public WITH CHECK ((has_role(auth.uid(), 'gestor_produto'::text) AND (gestor_id = auth.uid())));
DROP POLICY IF EXISTS "Gestores can update own clientes" ON public.clientes;
CREATE POLICY "Gestores can update own clientes" ON public.clientes AS PERMISSIVE FOR UPDATE TO public USING ((has_role(auth.uid(), 'gestor_produto'::text) AND (gestor_id = auth.uid())));
DROP POLICY IF EXISTS "Gestores can view own clientes" ON public.clientes;
CREATE POLICY "Gestores can view own clientes" ON public.clientes AS PERMISSIVE FOR SELECT TO public USING ((has_role(auth.uid(), 'gestor_produto'::text) AND (gestor_id = auth.uid())));
DROP POLICY IF EXISTS "Gestores produto can insert clientes direto" ON public.clientes;
CREATE POLICY "Gestores produto can insert clientes direto" ON public.clientes AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'gestor_produto'::text));
DROP POLICY IF EXISTS "Imobiliárias can update linked clientes" ON public.clientes;
CREATE POLICY "Imobiliárias can update linked clientes" ON public.clientes AS PERMISSIVE FOR UPDATE TO authenticated USING ((imobiliaria_id IN ( SELECT i.id
   FROM imobiliarias i
  WHERE (i.user_id = auth.uid()))));
DROP POLICY IF EXISTS "Imobiliárias can view linked clientes" ON public.clientes;
CREATE POLICY "Imobiliárias can view linked clientes" ON public.clientes AS PERMISSIVE FOR SELECT TO authenticated USING ((imobiliaria_id IN ( SELECT i.id
   FROM imobiliarias i
  WHERE (i.user_id = auth.uid()))));
DROP POLICY IF EXISTS "Incorporadores can view clientes from negociacoes" ON public.clientes;
CREATE POLICY "Incorporadores can view clientes from negociacoes" ON public.clientes AS PERMISSIVE FOR SELECT TO authenticated USING ((is_incorporador(auth.uid()) AND (id IN ( SELECT n.cliente_id
   FROM negociacoes n
  WHERE user_has_empreendimento_access(auth.uid(), n.empreendimento_id)))));
DROP POLICY IF EXISTS "Incorporadores can view clientes of their gestores" ON public.clientes;
CREATE POLICY "Incorporadores can view clientes of their gestores" ON public.clientes AS PERMISSIVE FOR SELECT TO authenticated USING ((is_incorporador(auth.uid()) AND (gestor_id IN ( SELECT ue.user_id
   FROM user_empreendimentos ue
  WHERE (ue.empreendimento_id IN ( SELECT user_empreendimentos.empreendimento_id
           FROM user_empreendimentos
          WHERE (user_empreendimentos.user_id = auth.uid())))))));
DROP POLICY IF EXISTS "Admins can manage comissao_parcelas" ON public.comissao_parcelas;
CREATE POLICY "Admins can manage comissao_parcelas" ON public.comissao_parcelas AS PERMISSIVE FOR ALL TO public USING (is_admin(auth.uid()));
DROP POLICY IF EXISTS "Gestores can manage comissao_parcelas" ON public.comissao_parcelas;
CREATE POLICY "Gestores can manage comissao_parcelas" ON public.comissao_parcelas AS PERMISSIVE FOR ALL TO public USING (has_role(auth.uid(), 'gestor_produto'::app_role));
DROP POLICY IF EXISTS "Users can view comissao_parcelas" ON public.comissao_parcelas;
CREATE POLICY "Users can view comissao_parcelas" ON public.comissao_parcelas AS PERMISSIVE FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM comissoes c
  WHERE ((c.id = comissao_parcelas.comissao_id) AND (is_admin(auth.uid()) OR has_role(auth.uid(), 'gestor_produto'::text) OR (c.corretor_id IN ( SELECT get_corretor_ids_by_user(auth.uid()) AS get_corretor_ids_by_user)))))));
DROP POLICY IF EXISTS "Admins can manage comissoes" ON public.comissoes;
CREATE POLICY "Admins can manage comissoes" ON public.comissoes AS PERMISSIVE FOR ALL TO public USING (is_admin(auth.uid()));
DROP POLICY IF EXISTS "Corretores can view own comissoes" ON public.comissoes;
CREATE POLICY "Corretores can view own comissoes" ON public.comissoes AS PERMISSIVE FOR SELECT TO authenticated USING ((corretor_id IN ( SELECT get_corretor_ids_by_user(auth.uid()) AS get_corretor_ids_by_user)));
DROP POLICY IF EXISTS "Gestores can insert comissoes" ON public.comissoes;
CREATE POLICY "Gestores can insert comissoes" ON public.comissoes AS PERMISSIVE FOR INSERT TO public WITH CHECK ((has_role(auth.uid(), 'gestor_produto'::text) AND (gestor_id = auth.uid())));
DROP POLICY IF EXISTS "Gestores can update own comissoes" ON public.comissoes;
CREATE POLICY "Gestores can update own comissoes" ON public.comissoes AS PERMISSIVE FOR UPDATE TO public USING ((has_role(auth.uid(), 'gestor_produto'::text) AND (gestor_id = auth.uid())));
DROP POLICY IF EXISTS "Gestores can view own comissoes" ON public.comissoes;
CREATE POLICY "Gestores can view own comissoes" ON public.comissoes AS PERMISSIVE FOR SELECT TO public USING ((has_role(auth.uid(), 'gestor_produto'::text) AND (gestor_id = auth.uid())));
DROP POLICY IF EXISTS "Admins can manage configuracao_comercial" ON public.configuracao_comercial;
CREATE POLICY "Admins can manage configuracao_comercial" ON public.configuracao_comercial AS PERMISSIVE FOR ALL TO public USING (is_admin(auth.uid()));
DROP POLICY IF EXISTS "Gestores can manage configuracao_comercial" ON public.configuracao_comercial;
CREATE POLICY "Gestores can manage configuracao_comercial" ON public.configuracao_comercial AS PERMISSIVE FOR ALL TO public USING (has_role(auth.uid(), 'gestor_produto'::app_role));
DROP POLICY IF EXISTS "Users can view configuracao_comercial of authorized empreendime" ON public.configuracao_comercial;
CREATE POLICY "Users can view configuracao_comercial of authorized empreendime" ON public.configuracao_comercial AS PERMISSIVE FOR SELECT TO public USING (user_has_empreendimento_access(auth.uid(), empreendimento_id));
DROP POLICY IF EXISTS "Admins can manage configuracao_comissoes" ON public.configuracao_comissoes;
CREATE POLICY "Admins can manage configuracao_comissoes" ON public.configuracao_comissoes AS PERMISSIVE FOR ALL TO public USING (is_admin(auth.uid()));
DROP POLICY IF EXISTS "Gestores can manage configuracao_comissoes" ON public.configuracao_comissoes;
CREATE POLICY "Gestores can manage configuracao_comissoes" ON public.configuracao_comissoes AS PERMISSIVE FOR ALL TO public USING (has_role(auth.uid(), 'gestor_produto'::app_role));
DROP POLICY IF EXISTS "Users can view configuracao_comissoes" ON public.configuracao_comissoes;
CREATE POLICY "Users can view configuracao_comissoes" ON public.configuracao_comissoes AS PERMISSIVE FOR SELECT TO public USING (user_has_empreendimento_access(auth.uid(), empreendimento_id));
DROP POLICY IF EXISTS "Admins can manage configuracoes_sistema" ON public.configuracoes_sistema;
CREATE POLICY "Admins can manage configuracoes_sistema" ON public.configuracoes_sistema AS PERMISSIVE FOR ALL TO public USING (is_admin(auth.uid()));
DROP POLICY IF EXISTS "Anyone can view configuracoes_sistema" ON public.configuracoes_sistema;
CREATE POLICY "Anyone can view configuracoes_sistema" ON public.configuracoes_sistema AS PERMISSIVE FOR SELECT TO public USING (true);
DROP POLICY IF EXISTS "Admins can manage contrato_aprovacoes" ON public.contrato_aprovacoes;
CREATE POLICY "Admins can manage contrato_aprovacoes" ON public.contrato_aprovacoes AS PERMISSIVE FOR ALL TO public USING (is_admin(auth.uid()));
DROP POLICY IF EXISTS "Aprovadores can update own aprovacoes" ON public.contrato_aprovacoes;
CREATE POLICY "Aprovadores can update own aprovacoes" ON public.contrato_aprovacoes AS PERMISSIVE FOR UPDATE TO public USING ((aprovador_id = auth.uid()));
DROP POLICY IF EXISTS "Gestores can manage contrato_aprovacoes" ON public.contrato_aprovacoes;
CREATE POLICY "Gestores can manage contrato_aprovacoes" ON public.contrato_aprovacoes AS PERMISSIVE FOR ALL TO public USING (has_role(auth.uid(), 'gestor_produto'::app_role));
DROP POLICY IF EXISTS "Users can insert contrato_aprovacoes" ON public.contrato_aprovacoes;
CREATE POLICY "Users can insert contrato_aprovacoes" ON public.contrato_aprovacoes AS PERMISSIVE FOR INSERT TO public WITH CHECK (true);
DROP POLICY IF EXISTS "Users can view contrato_aprovacoes" ON public.contrato_aprovacoes;
CREATE POLICY "Users can view contrato_aprovacoes" ON public.contrato_aprovacoes AS PERMISSIVE FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM contratos c
  WHERE ((c.id = contrato_aprovacoes.contrato_id) AND (is_admin(auth.uid()) OR has_role(auth.uid(), 'gestor_produto'::text) OR (c.corretor_id IN ( SELECT get_corretor_ids_by_user(auth.uid()) AS get_corretor_ids_by_user)))))));
DROP POLICY IF EXISTS "Admins can manage contrato_condicoes_pagamento" ON public.contrato_condicoes_pagamento;
CREATE POLICY "Admins can manage contrato_condicoes_pagamento" ON public.contrato_condicoes_pagamento AS PERMISSIVE FOR ALL TO public USING (is_admin(auth.uid()));
DROP POLICY IF EXISTS "Gestores can manage contrato_condicoes_pagamento" ON public.contrato_condicoes_pagamento;
CREATE POLICY "Gestores can manage contrato_condicoes_pagamento" ON public.contrato_condicoes_pagamento AS PERMISSIVE FOR ALL TO public USING (has_role(auth.uid(), 'gestor_produto'::app_role));
DROP POLICY IF EXISTS "Users can insert contrato_condicoes_pagamento" ON public.contrato_condicoes_pagamento;
CREATE POLICY "Users can insert contrato_condicoes_pagamento" ON public.contrato_condicoes_pagamento AS PERMISSIVE FOR INSERT TO public WITH CHECK (true);
DROP POLICY IF EXISTS "Users can update contrato_condicoes_pagamento" ON public.contrato_condicoes_pagamento;
CREATE POLICY "Users can update contrato_condicoes_pagamento" ON public.contrato_condicoes_pagamento AS PERMISSIVE FOR UPDATE TO public USING (true);
DROP POLICY IF EXISTS "Users can view contrato_condicoes_pagamento" ON public.contrato_condicoes_pagamento;
CREATE POLICY "Users can view contrato_condicoes_pagamento" ON public.contrato_condicoes_pagamento AS PERMISSIVE FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM contratos c
  WHERE ((c.id = contrato_condicoes_pagamento.contrato_id) AND (is_admin(auth.uid()) OR has_role(auth.uid(), 'gestor_produto'::text) OR (c.corretor_id IN ( SELECT get_corretor_ids_by_user(auth.uid()) AS get_corretor_ids_by_user)))))));
DROP POLICY IF EXISTS "Admins can manage contrato_documentos" ON public.contrato_documentos;
CREATE POLICY "Admins can manage contrato_documentos" ON public.contrato_documentos AS PERMISSIVE FOR ALL TO public USING (is_admin(auth.uid()));
DROP POLICY IF EXISTS "Gestores can manage contrato_documentos" ON public.contrato_documentos;
CREATE POLICY "Gestores can manage contrato_documentos" ON public.contrato_documentos AS PERMISSIVE FOR ALL TO public USING (has_role(auth.uid(), 'gestor_produto'::app_role));
DROP POLICY IF EXISTS "Users can insert contrato_documentos" ON public.contrato_documentos;
CREATE POLICY "Users can insert contrato_documentos" ON public.contrato_documentos AS PERMISSIVE FOR INSERT TO public WITH CHECK (true);
DROP POLICY IF EXISTS "Users can update contrato_documentos" ON public.contrato_documentos;
CREATE POLICY "Users can update contrato_documentos" ON public.contrato_documentos AS PERMISSIVE FOR UPDATE TO public USING (true);
DROP POLICY IF EXISTS "Users can view contrato_documentos" ON public.contrato_documentos;
CREATE POLICY "Users can view contrato_documentos" ON public.contrato_documentos AS PERMISSIVE FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM contratos c
  WHERE ((c.id = contrato_documentos.contrato_id) AND (is_admin(auth.uid()) OR has_role(auth.uid(), 'gestor_produto'::text) OR (c.corretor_id IN ( SELECT get_corretor_ids_by_user(auth.uid()) AS get_corretor_ids_by_user)))))));
DROP POLICY IF EXISTS "Admins can manage contrato_pendencias" ON public.contrato_pendencias;
CREATE POLICY "Admins can manage contrato_pendencias" ON public.contrato_pendencias AS PERMISSIVE FOR ALL TO public USING (is_admin(auth.uid()));
DROP POLICY IF EXISTS "Gestores can manage contrato_pendencias" ON public.contrato_pendencias;
CREATE POLICY "Gestores can manage contrato_pendencias" ON public.contrato_pendencias AS PERMISSIVE FOR ALL TO public USING (has_role(auth.uid(), 'gestor_produto'::app_role));
DROP POLICY IF EXISTS "Users can insert contrato_pendencias" ON public.contrato_pendencias;
CREATE POLICY "Users can insert contrato_pendencias" ON public.contrato_pendencias AS PERMISSIVE FOR INSERT TO public WITH CHECK (true);
DROP POLICY IF EXISTS "Users can update contrato_pendencias" ON public.contrato_pendencias;
CREATE POLICY "Users can update contrato_pendencias" ON public.contrato_pendencias AS PERMISSIVE FOR UPDATE TO public USING (true);
DROP POLICY IF EXISTS "Users can view contrato_pendencias" ON public.contrato_pendencias;
CREATE POLICY "Users can view contrato_pendencias" ON public.contrato_pendencias AS PERMISSIVE FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM contratos c
  WHERE ((c.id = contrato_pendencias.contrato_id) AND (is_admin(auth.uid()) OR has_role(auth.uid(), 'gestor_produto'::text) OR (c.corretor_id IN ( SELECT get_corretor_ids_by_user(auth.uid()) AS get_corretor_ids_by_user)))))));
DROP POLICY IF EXISTS "Admins can manage contrato_signatarios" ON public.contrato_signatarios;
CREATE POLICY "Admins can manage contrato_signatarios" ON public.contrato_signatarios AS PERMISSIVE FOR ALL TO public USING (is_admin(auth.uid()));
DROP POLICY IF EXISTS "Authorized users can insert contrato_signatarios" ON public.contrato_signatarios;
CREATE POLICY "Authorized users can insert contrato_signatarios" ON public.contrato_signatarios AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((is_admin(auth.uid()) OR has_role(auth.uid(), 'gestor_produto'::text) OR (EXISTS ( SELECT 1
   FROM contratos c
  WHERE ((c.id = contrato_signatarios.contrato_id) AND ((c.created_by = auth.uid()) OR (c.gestor_id = auth.uid()) OR (c.corretor_id IN ( SELECT get_corretor_ids_by_user(auth.uid()) AS get_corretor_ids_by_user))))))));
DROP POLICY IF EXISTS "Authorized users can update contrato_signatarios" ON public.contrato_signatarios;
CREATE POLICY "Authorized users can update contrato_signatarios" ON public.contrato_signatarios AS PERMISSIVE FOR UPDATE TO authenticated USING ((is_admin(auth.uid()) OR has_role(auth.uid(), 'gestor_produto'::text) OR (EXISTS ( SELECT 1
   FROM contratos c
  WHERE ((c.id = contrato_signatarios.contrato_id) AND ((c.created_by = auth.uid()) OR (c.gestor_id = auth.uid()) OR (c.corretor_id IN ( SELECT get_corretor_ids_by_user(auth.uid()) AS get_corretor_ids_by_user)))))))) WITH CHECK ((is_admin(auth.uid()) OR has_role(auth.uid(), 'gestor_produto'::text) OR (EXISTS ( SELECT 1
   FROM contratos c
  WHERE ((c.id = contrato_signatarios.contrato_id) AND ((c.created_by = auth.uid()) OR (c.gestor_id = auth.uid()) OR (c.corretor_id IN ( SELECT get_corretor_ids_by_user(auth.uid()) AS get_corretor_ids_by_user))))))));
DROP POLICY IF EXISTS "Gestores can manage contrato_signatarios" ON public.contrato_signatarios;
CREATE POLICY "Gestores can manage contrato_signatarios" ON public.contrato_signatarios AS PERMISSIVE FOR ALL TO public USING (has_role(auth.uid(), 'gestor_produto'::app_role));
DROP POLICY IF EXISTS "Users can view contrato_signatarios" ON public.contrato_signatarios;
CREATE POLICY "Users can view contrato_signatarios" ON public.contrato_signatarios AS PERMISSIVE FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM contratos c
  WHERE ((c.id = contrato_signatarios.contrato_id) AND (is_admin(auth.uid()) OR has_role(auth.uid(), 'gestor_produto'::text) OR (c.corretor_id IN ( SELECT get_corretor_ids_by_user(auth.uid()) AS get_corretor_ids_by_user)))))));
DROP POLICY IF EXISTS "Admins can manage contrato_template_imagens" ON public.contrato_template_imagens;
CREATE POLICY "Admins can manage contrato_template_imagens" ON public.contrato_template_imagens AS PERMISSIVE FOR ALL TO public USING (is_admin(auth.uid()));
DROP POLICY IF EXISTS "Gestores can manage contrato_template_imagens" ON public.contrato_template_imagens;
CREATE POLICY "Gestores can manage contrato_template_imagens" ON public.contrato_template_imagens AS PERMISSIVE FOR ALL TO public USING (has_role(auth.uid(), 'gestor_produto'::app_role));
DROP POLICY IF EXISTS "Users can insert contrato_template_imagens" ON public.contrato_template_imagens;
CREATE POLICY "Users can insert contrato_template_imagens" ON public.contrato_template_imagens AS PERMISSIVE FOR INSERT TO public WITH CHECK (true);
DROP POLICY IF EXISTS "Users can view contrato_template_imagens" ON public.contrato_template_imagens;
CREATE POLICY "Users can view contrato_template_imagens" ON public.contrato_template_imagens AS PERMISSIVE FOR SELECT TO public USING ((EXISTS ( SELECT 1
   FROM contrato_templates t
  WHERE ((t.id = contrato_template_imagens.template_id) AND (t.is_active = true)))));
DROP POLICY IF EXISTS "Admins can manage contrato_templates" ON public.contrato_templates;
CREATE POLICY "Admins can manage contrato_templates" ON public.contrato_templates AS PERMISSIVE FOR ALL TO public USING (is_admin(auth.uid()));
DROP POLICY IF EXISTS "Gestores can manage contrato_templates" ON public.contrato_templates;
CREATE POLICY "Gestores can manage contrato_templates" ON public.contrato_templates AS PERMISSIVE FOR ALL TO public USING (has_role(auth.uid(), 'gestor_produto'::app_role));
DROP POLICY IF EXISTS "Users can view active templates" ON public.contrato_templates;
CREATE POLICY "Users can view active templates" ON public.contrato_templates AS PERMISSIVE FOR SELECT TO public USING ((is_active = true));
DROP POLICY IF EXISTS "Admins can manage contrato_unidades" ON public.contrato_unidades;
CREATE POLICY "Admins can manage contrato_unidades" ON public.contrato_unidades AS PERMISSIVE FOR ALL TO public USING (is_admin(auth.uid()));
DROP POLICY IF EXISTS "Gestores can manage contrato_unidades" ON public.contrato_unidades;
CREATE POLICY "Gestores can manage contrato_unidades" ON public.contrato_unidades AS PERMISSIVE FOR ALL TO public USING (has_role(auth.uid(), 'gestor_produto'::app_role));
DROP POLICY IF EXISTS "Users can insert contrato_unidades" ON public.contrato_unidades;
CREATE POLICY "Users can insert contrato_unidades" ON public.contrato_unidades AS PERMISSIVE FOR INSERT TO public WITH CHECK (true);
DROP POLICY IF EXISTS "Users can view contrato_unidades" ON public.contrato_unidades;
CREATE POLICY "Users can view contrato_unidades" ON public.contrato_unidades AS PERMISSIVE FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM contratos c
  WHERE ((c.id = contrato_unidades.contrato_id) AND (is_admin(auth.uid()) OR has_role(auth.uid(), 'gestor_produto'::text) OR (c.corretor_id IN ( SELECT get_corretor_ids_by_user(auth.uid()) AS get_corretor_ids_by_user)))))));
DROP POLICY IF EXISTS "Admins can manage contrato_variaveis" ON public.contrato_variaveis;
CREATE POLICY "Admins can manage contrato_variaveis" ON public.contrato_variaveis AS PERMISSIVE FOR ALL TO public USING (is_admin(auth.uid()));
DROP POLICY IF EXISTS "Gestores can manage contrato_variaveis" ON public.contrato_variaveis;
CREATE POLICY "Gestores can manage contrato_variaveis" ON public.contrato_variaveis AS PERMISSIVE FOR ALL TO public USING (has_role(auth.uid(), 'gestor_produto'::app_role));
DROP POLICY IF EXISTS "Users can view active contrato_variaveis" ON public.contrato_variaveis;
CREATE POLICY "Users can view active contrato_variaveis" ON public.contrato_variaveis AS PERMISSIVE FOR SELECT TO public USING ((is_active = true));
DROP POLICY IF EXISTS "Admins can manage contrato_versoes" ON public.contrato_versoes;
CREATE POLICY "Admins can manage contrato_versoes" ON public.contrato_versoes AS PERMISSIVE FOR ALL TO public USING (is_admin(auth.uid()));
DROP POLICY IF EXISTS "Gestores can manage contrato_versoes" ON public.contrato_versoes;
CREATE POLICY "Gestores can manage contrato_versoes" ON public.contrato_versoes AS PERMISSIVE FOR ALL TO public USING (has_role(auth.uid(), 'gestor_produto'::app_role));
DROP POLICY IF EXISTS "Users can insert contrato_versoes" ON public.contrato_versoes;
CREATE POLICY "Users can insert contrato_versoes" ON public.contrato_versoes AS PERMISSIVE FOR INSERT TO public WITH CHECK (true);
DROP POLICY IF EXISTS "Users can view contrato_versoes" ON public.contrato_versoes;
CREATE POLICY "Users can view contrato_versoes" ON public.contrato_versoes AS PERMISSIVE FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM contratos c
  WHERE ((c.id = contrato_versoes.contrato_id) AND (is_admin(auth.uid()) OR has_role(auth.uid(), 'gestor_produto'::text) OR (c.corretor_id IN ( SELECT get_corretor_ids_by_user(auth.uid()) AS get_corretor_ids_by_user)))))));
DROP POLICY IF EXISTS "Admins can manage contratos" ON public.contratos;
CREATE POLICY "Admins can manage contratos" ON public.contratos AS PERMISSIVE FOR ALL TO public USING (is_admin(auth.uid()));
DROP POLICY IF EXISTS "Corretores can create contratos" ON public.contratos;
CREATE POLICY "Corretores can create contratos" ON public.contratos AS PERMISSIVE FOR INSERT TO public WITH CHECK (true);
DROP POLICY IF EXISTS "Corretores can view own contratos" ON public.contratos;
CREATE POLICY "Corretores can view own contratos" ON public.contratos AS PERMISSIVE FOR SELECT TO authenticated USING ((corretor_id IN ( SELECT get_corretor_ids_by_user(auth.uid()) AS get_corretor_ids_by_user)));
DROP POLICY IF EXISTS "Gestores can insert contratos" ON public.contratos;
CREATE POLICY "Gestores can insert contratos" ON public.contratos AS PERMISSIVE FOR INSERT TO public WITH CHECK ((has_role(auth.uid(), 'gestor_produto'::text) AND (gestor_id = auth.uid())));
DROP POLICY IF EXISTS "Gestores can update own contratos" ON public.contratos;
CREATE POLICY "Gestores can update own contratos" ON public.contratos AS PERMISSIVE FOR UPDATE TO public USING ((has_role(auth.uid(), 'gestor_produto'::text) AND (gestor_id = auth.uid())));
DROP POLICY IF EXISTS "Gestores can view own contratos" ON public.contratos;
CREATE POLICY "Gestores can view own contratos" ON public.contratos AS PERMISSIVE FOR SELECT TO public USING ((has_role(auth.uid(), 'gestor_produto'::text) AND (gestor_id = auth.uid())));
DROP POLICY IF EXISTS "Gestores podem atualizar contratos ativos" ON public.contratos;
CREATE POLICY "Gestores podem atualizar contratos ativos" ON public.contratos AS PERMISSIVE FOR UPDATE TO authenticated USING (((is_active = true) AND (is_admin(auth.uid()) OR (gestor_id = auth.uid())))) WITH CHECK ((is_active = true));
DROP POLICY IF EXISTS "Super admin pode atualizar contratos" ON public.contratos;
CREATE POLICY "Super admin pode atualizar contratos" ON public.contratos AS PERMISSIVE FOR UPDATE TO authenticated USING (is_super_admin(auth.uid())) WITH CHECK (true);
DROP POLICY IF EXISTS "Admins can manage corretores" ON public.corretores;
CREATE POLICY "Admins can manage corretores" ON public.corretores AS PERMISSIVE FOR ALL TO public USING (is_admin(auth.uid()));
DROP POLICY IF EXISTS "Authenticated users can view corretores" ON public.corretores;
CREATE POLICY "Authenticated users can view corretores" ON public.corretores AS PERMISSIVE FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Gestor imobiliaria can insert own corretores" ON public.corretores;
CREATE POLICY "Gestor imobiliaria can insert own corretores" ON public.corretores AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((is_gestor_imobiliaria(auth.uid()) AND (imobiliaria_id = get_user_imobiliaria_id(auth.uid()))));
DROP POLICY IF EXISTS "Gestor imobiliaria can update own corretores" ON public.corretores;
CREATE POLICY "Gestor imobiliaria can update own corretores" ON public.corretores AS PERMISSIVE FOR UPDATE TO authenticated USING ((is_gestor_imobiliaria(auth.uid()) AND (imobiliaria_id = get_user_imobiliaria_id(auth.uid()))));
DROP POLICY IF EXISTS "Gestor imobiliaria can view own corretores" ON public.corretores;
CREATE POLICY "Gestor imobiliaria can view own corretores" ON public.corretores AS PERMISSIVE FOR SELECT TO authenticated USING ((is_gestor_imobiliaria(auth.uid()) AND (imobiliaria_id = get_user_imobiliaria_id(auth.uid()))));
DROP POLICY IF EXISTS "Gestores can manage corretores" ON public.corretores;
CREATE POLICY "Gestores can manage corretores" ON public.corretores AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'gestor_produto'::app_role));
DROP POLICY IF EXISTS "Admins can manage empreendimento_corretores" ON public.empreendimento_corretores;
CREATE POLICY "Admins can manage empreendimento_corretores" ON public.empreendimento_corretores AS PERMISSIVE FOR ALL TO public USING (is_admin(auth.uid()));
DROP POLICY IF EXISTS "Gestores can manage empreendimento_corretores" ON public.empreendimento_corretores;
CREATE POLICY "Gestores can manage empreendimento_corretores" ON public.empreendimento_corretores AS PERMISSIVE FOR ALL TO public USING (has_role(auth.uid(), 'gestor_produto'::app_role));
DROP POLICY IF EXISTS "Users can view empreendimento_corretores of authorized empreend" ON public.empreendimento_corretores;
CREATE POLICY "Users can view empreendimento_corretores of authorized empreend" ON public.empreendimento_corretores AS PERMISSIVE FOR SELECT TO public USING (user_has_empreendimento_access(auth.uid(), empreendimento_id));
DROP POLICY IF EXISTS "Admins can manage documentos" ON public.empreendimento_documentos;
CREATE POLICY "Admins can manage documentos" ON public.empreendimento_documentos AS PERMISSIVE FOR ALL TO public USING (is_admin(auth.uid()));
DROP POLICY IF EXISTS "Gestores can manage documentos" ON public.empreendimento_documentos;
CREATE POLICY "Gestores can manage documentos" ON public.empreendimento_documentos AS PERMISSIVE FOR ALL TO public USING (has_role(auth.uid(), 'gestor_produto'::app_role));
DROP POLICY IF EXISTS "Users can view documentos of authorized empreendimentos" ON public.empreendimento_documentos;
CREATE POLICY "Users can view documentos of authorized empreendimentos" ON public.empreendimento_documentos AS PERMISSIVE FOR SELECT TO public USING (user_has_empreendimento_access(auth.uid(), empreendimento_id));
DROP POLICY IF EXISTS "Admins can manage empreendimento_imobiliarias" ON public.empreendimento_imobiliarias;
CREATE POLICY "Admins can manage empreendimento_imobiliarias" ON public.empreendimento_imobiliarias AS PERMISSIVE FOR ALL TO public USING (is_admin(auth.uid()));
DROP POLICY IF EXISTS "Gestores can manage empreendimento_imobiliarias" ON public.empreendimento_imobiliarias;
CREATE POLICY "Gestores can manage empreendimento_imobiliarias" ON public.empreendimento_imobiliarias AS PERMISSIVE FOR ALL TO public USING (has_role(auth.uid(), 'gestor_produto'::app_role));
DROP POLICY IF EXISTS "Users can view empreendimento_imobiliarias of authorized empree" ON public.empreendimento_imobiliarias;
CREATE POLICY "Users can view empreendimento_imobiliarias of authorized empree" ON public.empreendimento_imobiliarias AS PERMISSIVE FOR SELECT TO public USING (user_has_empreendimento_access(auth.uid(), empreendimento_id));
DROP POLICY IF EXISTS "Admins can manage midias" ON public.empreendimento_midias;
CREATE POLICY "Admins can manage midias" ON public.empreendimento_midias AS PERMISSIVE FOR ALL TO public USING (is_admin(auth.uid()));
DROP POLICY IF EXISTS "Gestores can manage midias" ON public.empreendimento_midias;
CREATE POLICY "Gestores can manage midias" ON public.empreendimento_midias AS PERMISSIVE FOR ALL TO public USING (has_role(auth.uid(), 'gestor_produto'::app_role));
DROP POLICY IF EXISTS "Users can view midias of authorized empreendimentos" ON public.empreendimento_midias;
CREATE POLICY "Users can view midias of authorized empreendimentos" ON public.empreendimento_midias AS PERMISSIVE FOR SELECT TO public USING (user_has_empreendimento_access(auth.uid(), empreendimento_id));
DROP POLICY IF EXISTS "Admins can manage empreendimentos" ON public.empreendimentos;
CREATE POLICY "Admins can manage empreendimentos" ON public.empreendimentos AS PERMISSIVE FOR ALL TO public USING (is_admin(auth.uid()));
DROP POLICY IF EXISTS "Gestores can manage empreendimentos" ON public.empreendimentos;
CREATE POLICY "Gestores can manage empreendimentos" ON public.empreendimentos AS PERMISSIVE FOR ALL TO public USING (has_role(auth.uid(), 'gestor_produto'::app_role));
DROP POLICY IF EXISTS "Users can view authorized empreendimentos" ON public.empreendimentos;
CREATE POLICY "Users can view authorized empreendimentos" ON public.empreendimentos AS PERMISSIVE FOR SELECT TO public USING (user_has_empreendimento_access(auth.uid(), id));
DROP POLICY IF EXISTS "Admins and seven team can delete inscricoes" ON public.evento_inscricoes;
CREATE POLICY "Admins and seven team can delete inscricoes" ON public.evento_inscricoes AS PERMISSIVE FOR DELETE TO authenticated USING ((is_admin(auth.uid()) OR is_seven_team(auth.uid()) OR (user_id = auth.uid())));
DROP POLICY IF EXISTS "Users and admins can update inscricoes" ON public.evento_inscricoes;
CREATE POLICY "Users and admins can update inscricoes" ON public.evento_inscricoes AS PERMISSIVE FOR UPDATE TO authenticated USING (((user_id = auth.uid()) OR is_admin(auth.uid()) OR is_seven_team(auth.uid()))) WITH CHECK (((user_id = auth.uid()) OR is_admin(auth.uid()) OR is_seven_team(auth.uid())));
DROP POLICY IF EXISTS "Users can insert own inscricoes" ON public.evento_inscricoes;
CREATE POLICY "Users can insert own inscricoes" ON public.evento_inscricoes AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((user_id = auth.uid()));
DROP POLICY IF EXISTS "Users can view own inscricoes" ON public.evento_inscricoes;
CREATE POLICY "Users can view own inscricoes" ON public.evento_inscricoes AS PERMISSIVE FOR SELECT TO authenticated USING (((user_id = auth.uid()) OR is_seven_team(auth.uid()) OR is_admin(auth.uid())));
DROP POLICY IF EXISTS "Admins can manage evento_membros" ON public.evento_membros;
CREATE POLICY "Admins can manage evento_membros" ON public.evento_membros AS PERMISSIVE FOR ALL TO public USING (is_admin(auth.uid()));
DROP POLICY IF EXISTS "Marketing supervisors can manage evento_membros" ON public.evento_membros;
CREATE POLICY "Marketing supervisors can manage evento_membros" ON public.evento_membros AS PERMISSIVE FOR ALL TO public USING (is_marketing_supervisor(auth.uid()));
DROP POLICY IF EXISTS "Supervisor relacionamento can manage evento_membros" ON public.evento_membros;
CREATE POLICY "Supervisor relacionamento can manage evento_membros" ON public.evento_membros AS PERMISSIVE FOR ALL TO public USING (has_role(auth.uid(), 'supervisor_relacionamento'::app_role));
DROP POLICY IF EXISTS "Admins can manage evento_tarefas" ON public.evento_tarefas;
CREATE POLICY "Admins can manage evento_tarefas" ON public.evento_tarefas AS PERMISSIVE FOR ALL TO public USING (is_admin(auth.uid()));
DROP POLICY IF EXISTS "Supervisor relacionamento can manage evento_tarefas" ON public.evento_tarefas;
CREATE POLICY "Supervisor relacionamento can manage evento_tarefas" ON public.evento_tarefas AS PERMISSIVE FOR ALL TO public USING (has_role(auth.uid(), 'supervisor_relacionamento'::app_role));
DROP POLICY IF EXISTS "Supervisores can view evento_tarefas" ON public.evento_tarefas;
CREATE POLICY "Supervisores can view evento_tarefas" ON public.evento_tarefas AS PERMISSIVE FOR SELECT TO public USING (is_marketing_supervisor(auth.uid()));
DROP POLICY IF EXISTS "Admins can manage evento_template_tarefas" ON public.evento_template_tarefas;
CREATE POLICY "Admins can manage evento_template_tarefas" ON public.evento_template_tarefas AS PERMISSIVE FOR ALL TO public USING (is_admin(auth.uid()));
DROP POLICY IF EXISTS "Gestores can manage evento_template_tarefas" ON public.evento_template_tarefas;
CREATE POLICY "Gestores can manage evento_template_tarefas" ON public.evento_template_tarefas AS PERMISSIVE FOR ALL TO public USING (has_role(auth.uid(), 'gestor_produto'::app_role));
DROP POLICY IF EXISTS "Users can view evento_template_tarefas" ON public.evento_template_tarefas;
CREATE POLICY "Users can view evento_template_tarefas" ON public.evento_template_tarefas AS PERMISSIVE FOR SELECT TO public USING ((EXISTS ( SELECT 1
   FROM evento_templates t
  WHERE ((t.id = evento_template_tarefas.template_id) AND (t.is_active = true)))));
DROP POLICY IF EXISTS "Admins can manage evento_templates" ON public.evento_templates;
CREATE POLICY "Admins can manage evento_templates" ON public.evento_templates AS PERMISSIVE FOR ALL TO public USING (is_admin(auth.uid()));
DROP POLICY IF EXISTS "Gestores can manage evento_templates" ON public.evento_templates;
CREATE POLICY "Gestores can manage evento_templates" ON public.evento_templates AS PERMISSIVE FOR ALL TO public USING (has_role(auth.uid(), 'gestor_produto'::app_role));
DROP POLICY IF EXISTS "Users can view active evento_templates" ON public.evento_templates;
CREATE POLICY "Users can view active evento_templates" ON public.evento_templates AS PERMISSIVE FOR SELECT TO public USING ((is_active = true));
DROP POLICY IF EXISTS "Admins can manage eventos" ON public.eventos;
CREATE POLICY "Admins can manage eventos" ON public.eventos AS PERMISSIVE FOR ALL TO public USING (is_admin(auth.uid()));
DROP POLICY IF EXISTS "Authenticated users can view active eventos" ON public.eventos;
CREATE POLICY "Authenticated users can view active eventos" ON public.eventos AS PERMISSIVE FOR SELECT TO authenticated USING ((is_active = true));
DROP POLICY IF EXISTS "Supervisor relacionamento can manage eventos" ON public.eventos;
CREATE POLICY "Supervisor relacionamento can manage eventos" ON public.eventos AS PERMISSIVE FOR ALL TO public USING (has_role(auth.uid(), 'supervisor_relacionamento'::app_role));
DROP POLICY IF EXISTS "Supervisores can view eventos" ON public.eventos;
CREATE POLICY "Supervisores can view eventos" ON public.eventos AS PERMISSIVE FOR SELECT TO public USING (is_marketing_supervisor(auth.uid()));
DROP POLICY IF EXISTS "Fachadas are viewable by authenticated users" ON public.fachadas;
CREATE POLICY "Fachadas are viewable by authenticated users" ON public.fachadas AS PERMISSIVE FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Fachadas can be created by authenticated users" ON public.fachadas;
CREATE POLICY "Fachadas can be created by authenticated users" ON public.fachadas AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Fachadas can be deleted by authenticated users" ON public.fachadas;
CREATE POLICY "Fachadas can be deleted by authenticated users" ON public.fachadas AS PERMISSIVE FOR DELETE TO authenticated USING (true);
DROP POLICY IF EXISTS "Fachadas can be updated by authenticated users" ON public.fachadas;
CREATE POLICY "Fachadas can be updated by authenticated users" ON public.fachadas AS PERMISSIVE FOR UPDATE TO authenticated USING (true);
DROP POLICY IF EXISTS "Admins can manage fluxo_aprovacao_config" ON public.fluxo_aprovacao_config;
CREATE POLICY "Admins can manage fluxo_aprovacao_config" ON public.fluxo_aprovacao_config AS PERMISSIVE FOR ALL TO public USING (is_admin(auth.uid()));
DROP POLICY IF EXISTS "Gestores can manage fluxo_aprovacao_config" ON public.fluxo_aprovacao_config;
CREATE POLICY "Gestores can manage fluxo_aprovacao_config" ON public.fluxo_aprovacao_config AS PERMISSIVE FOR ALL TO public USING (has_role(auth.uid(), 'gestor_produto'::app_role));
DROP POLICY IF EXISTS "Users can view fluxo_aprovacao_config" ON public.fluxo_aprovacao_config;
CREATE POLICY "Users can view fluxo_aprovacao_config" ON public.fluxo_aprovacao_config AS PERMISSIVE FOR SELECT TO public USING ((is_active = true));
DROP POLICY IF EXISTS "Admins can manage funil_etapas" ON public.funil_etapas;
CREATE POLICY "Admins can manage funil_etapas" ON public.funil_etapas AS PERMISSIVE FOR ALL TO public USING (is_admin(auth.uid()));
DROP POLICY IF EXISTS "Gestores can manage funil_etapas" ON public.funil_etapas;
CREATE POLICY "Gestores can manage funil_etapas" ON public.funil_etapas AS PERMISSIVE FOR ALL TO public USING (has_role(auth.uid(), 'gestor_produto'::app_role));
DROP POLICY IF EXISTS "Incorporadores podem ler etapas" ON public.funil_etapas;
CREATE POLICY "Incorporadores podem ler etapas" ON public.funil_etapas AS PERMISSIVE FOR SELECT TO authenticated USING ((is_incorporador(auth.uid()) AND (is_active = true)));
DROP POLICY IF EXISTS "Users can view funil_etapas" ON public.funil_etapas;
CREATE POLICY "Users can view funil_etapas" ON public.funil_etapas AS PERMISSIVE FOR SELECT TO public USING (((is_active = true) AND (EXISTS ( SELECT 1
   FROM funis f
  WHERE ((f.id = funil_etapas.funil_id) AND (f.is_active = true))))));
DROP POLICY IF EXISTS "Admins can manage funis" ON public.funis;
CREATE POLICY "Admins can manage funis" ON public.funis AS PERMISSIVE FOR ALL TO public USING (is_admin(auth.uid()));
DROP POLICY IF EXISTS "Gestores can manage funis" ON public.funis;
CREATE POLICY "Gestores can manage funis" ON public.funis AS PERMISSIVE FOR ALL TO public USING (has_role(auth.uid(), 'gestor_produto'::app_role));
DROP POLICY IF EXISTS "Users can view funis" ON public.funis;
CREATE POLICY "Users can view funis" ON public.funis AS PERMISSIVE FOR SELECT TO public USING (((is_active = true) AND ((empreendimento_id IS NULL) OR user_has_empreendimento_access(auth.uid(), empreendimento_id))));
DROP POLICY IF EXISTS "Admins can view all calendar embeds" ON public.google_calendar_embeds;
CREATE POLICY "Admins can view all calendar embeds" ON public.google_calendar_embeds AS PERMISSIVE FOR SELECT TO authenticated USING (is_admin(auth.uid()));
DROP POLICY IF EXISTS "Users can manage their own calendar embeds" ON public.google_calendar_embeds;
CREATE POLICY "Users can manage their own calendar embeds" ON public.google_calendar_embeds AS PERMISSIVE FOR ALL TO authenticated USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));
DROP POLICY IF EXISTS "Admins can manage imobiliarias" ON public.imobiliarias;
CREATE POLICY "Admins can manage imobiliarias" ON public.imobiliarias AS PERMISSIVE FOR ALL TO public USING (is_admin(auth.uid()));
DROP POLICY IF EXISTS "Authenticated users can view imobiliarias" ON public.imobiliarias;
CREATE POLICY "Authenticated users can view imobiliarias" ON public.imobiliarias AS PERMISSIVE FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Gestores can manage imobiliarias" ON public.imobiliarias;
CREATE POLICY "Gestores can manage imobiliarias" ON public.imobiliarias AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'gestor_produto'::app_role));
DROP POLICY IF EXISTS "Admins podem atualizar incorporadoras" ON public.incorporadoras;
CREATE POLICY "Admins podem atualizar incorporadoras" ON public.incorporadoras AS PERMISSIVE FOR UPDATE TO authenticated USING (is_admin(auth.uid()));
DROP POLICY IF EXISTS "Admins podem criar incorporadoras" ON public.incorporadoras;
CREATE POLICY "Admins podem criar incorporadoras" ON public.incorporadoras AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (is_admin(auth.uid()));
DROP POLICY IF EXISTS "Admins podem deletar incorporadoras" ON public.incorporadoras;
CREATE POLICY "Admins podem deletar incorporadoras" ON public.incorporadoras AS PERMISSIVE FOR DELETE TO authenticated USING (is_admin(auth.uid()));
DROP POLICY IF EXISTS "Usuários autenticados podem visualizar incorporadoras" ON public.incorporadoras;
CREATE POLICY "Usuários autenticados podem visualizar incorporadoras" ON public.incorporadoras AS PERMISSIVE FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Admins can manage lancamentos" ON public.lancamentos_financeiros;
CREATE POLICY "Admins can manage lancamentos" ON public.lancamentos_financeiros AS PERMISSIVE FOR ALL TO public USING (is_admin(auth.uid()));
DROP POLICY IF EXISTS "Gestores can view lancamentos" ON public.lancamentos_financeiros;
CREATE POLICY "Gestores can view lancamentos" ON public.lancamentos_financeiros AS PERMISSIVE FOR SELECT TO public USING (has_role(auth.uid(), 'gestor_produto'::app_role));
DROP POLICY IF EXISTS "Users can insert lancamentos" ON public.lancamentos_financeiros;
CREATE POLICY "Users can insert lancamentos" ON public.lancamentos_financeiros AS PERMISSIVE FOR INSERT TO public WITH CHECK (true);
DROP POLICY IF EXISTS "Admins can manage mapas" ON public.mapa_empreendimento;
CREATE POLICY "Admins can manage mapas" ON public.mapa_empreendimento AS PERMISSIVE FOR ALL TO public USING (is_admin(auth.uid()));
DROP POLICY IF EXISTS "Gestores can manage mapas" ON public.mapa_empreendimento;
CREATE POLICY "Gestores can manage mapas" ON public.mapa_empreendimento AS PERMISSIVE FOR ALL TO public USING (has_role(auth.uid(), 'gestor_produto'::app_role));
DROP POLICY IF EXISTS "Users can view mapas of authorized empreendimentos" ON public.mapa_empreendimento;
CREATE POLICY "Users can view mapas of authorized empreendimentos" ON public.mapa_empreendimento AS PERMISSIVE FOR SELECT TO public USING (user_has_empreendimento_access(auth.uid(), empreendimento_id));
DROP POLICY IF EXISTS "Admins can manage metas_comerciais" ON public.metas_comerciais;
CREATE POLICY "Admins can manage metas_comerciais" ON public.metas_comerciais AS PERMISSIVE FOR ALL TO public USING (is_admin(auth.uid()));
DROP POLICY IF EXISTS "Gestores can manage metas_comerciais" ON public.metas_comerciais;
CREATE POLICY "Gestores can manage metas_comerciais" ON public.metas_comerciais AS PERMISSIVE FOR ALL TO public USING (has_role(auth.uid(), 'gestor_produto'::app_role));
DROP POLICY IF EXISTS "Users can view metas_comerciais" ON public.metas_comerciais;
CREATE POLICY "Users can view metas_comerciais" ON public.metas_comerciais AS PERMISSIVE FOR SELECT TO public USING (true);
DROP POLICY IF EXISTS "Admins can manage modalidade_componentes" ON public.modalidade_componentes;
CREATE POLICY "Admins can manage modalidade_componentes" ON public.modalidade_componentes AS PERMISSIVE FOR ALL TO public USING (is_admin(auth.uid()));
DROP POLICY IF EXISTS "Gestores can manage modalidade_componentes" ON public.modalidade_componentes;
CREATE POLICY "Gestores can manage modalidade_componentes" ON public.modalidade_componentes AS PERMISSIVE FOR ALL TO public USING (has_role(auth.uid(), 'gestor_produto'::app_role));
DROP POLICY IF EXISTS "Users can view active modalidade_componentes" ON public.modalidade_componentes;
CREATE POLICY "Users can view active modalidade_componentes" ON public.modalidade_componentes AS PERMISSIVE FOR SELECT TO public USING ((is_active = true));
DROP POLICY IF EXISTS "Admins can manage modalidades_pagamento" ON public.modalidades_pagamento;
CREATE POLICY "Admins can manage modalidades_pagamento" ON public.modalidades_pagamento AS PERMISSIVE FOR ALL TO public USING (is_admin(auth.uid()));
DROP POLICY IF EXISTS "Gestores can manage modalidades_pagamento" ON public.modalidades_pagamento;
CREATE POLICY "Gestores can manage modalidades_pagamento" ON public.modalidades_pagamento AS PERMISSIVE FOR ALL TO public USING (has_role(auth.uid(), 'gestor_produto'::app_role));
DROP POLICY IF EXISTS "Users can view active modalidades" ON public.modalidades_pagamento;
CREATE POLICY "Users can view active modalidades" ON public.modalidades_pagamento AS PERMISSIVE FOR SELECT TO public USING ((is_active = true));
DROP POLICY IF EXISTS "Admins can manage modules" ON public.modules;
CREATE POLICY "Admins can manage modules" ON public.modules AS PERMISSIVE FOR ALL TO authenticated USING (is_admin(auth.uid()));
DROP POLICY IF EXISTS "Authenticated users can view active modules" ON public.modules;
CREATE POLICY "Authenticated users can view active modules" ON public.modules AS PERMISSIVE FOR SELECT TO authenticated USING ((is_active = true));
DROP POLICY IF EXISTS "Admins can manage negociacao_clientes" ON public.negociacao_clientes;
CREATE POLICY "Admins can manage negociacao_clientes" ON public.negociacao_clientes AS PERMISSIVE FOR ALL TO public USING (is_admin(auth.uid()));
DROP POLICY IF EXISTS "Gestores can manage negociacao_clientes" ON public.negociacao_clientes;
CREATE POLICY "Gestores can manage negociacao_clientes" ON public.negociacao_clientes AS PERMISSIVE FOR ALL TO public USING (has_role(auth.uid(), 'gestor_produto'::app_role));
DROP POLICY IF EXISTS "Users can insert negociacao_clientes" ON public.negociacao_clientes;
CREATE POLICY "Users can insert negociacao_clientes" ON public.negociacao_clientes AS PERMISSIVE FOR INSERT TO public WITH CHECK (true);
DROP POLICY IF EXISTS "Users can update negociacao_clientes" ON public.negociacao_clientes;
CREATE POLICY "Users can update negociacao_clientes" ON public.negociacao_clientes AS PERMISSIVE FOR UPDATE TO public USING (true);
DROP POLICY IF EXISTS "Users can view negociacao_clientes" ON public.negociacao_clientes;
CREATE POLICY "Users can view negociacao_clientes" ON public.negociacao_clientes AS PERMISSIVE FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM negociacoes n
  WHERE ((n.id = negociacao_clientes.negociacao_id) AND (is_admin(auth.uid()) OR has_role(auth.uid(), 'gestor_produto'::text) OR (n.corretor_id IN ( SELECT get_corretor_ids_by_user(auth.uid()) AS get_corretor_ids_by_user)))))));
DROP POLICY IF EXISTS "Authenticated users can insert comments" ON public.negociacao_comentarios;
CREATE POLICY "Authenticated users can insert comments" ON public.negociacao_comentarios AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));
DROP POLICY IF EXISTS "Authenticated users can read comments" ON public.negociacao_comentarios;
CREATE POLICY "Authenticated users can read comments" ON public.negociacao_comentarios AS PERMISSIVE FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Incorporador pode inserir comentarios nas negociacoes dos seus " ON public.negociacao_comentarios;
CREATE POLICY "Incorporador pode inserir comentarios nas negociacoes dos seus " ON public.negociacao_comentarios AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (((auth.uid() = user_id) AND is_incorporador(auth.uid()) AND (EXISTS ( SELECT 1
   FROM (negociacoes n
     JOIN user_empreendimentos ue ON ((ue.empreendimento_id = n.empreendimento_id)))
  WHERE ((n.id = negociacao_comentarios.negociacao_id) AND (ue.user_id = auth.uid()))))));
DROP POLICY IF EXISTS "Incorporador pode ler comentarios das negociacoes dos seus empr" ON public.negociacao_comentarios;
CREATE POLICY "Incorporador pode ler comentarios das negociacoes dos seus empr" ON public.negociacao_comentarios AS PERMISSIVE FOR SELECT TO authenticated USING ((is_incorporador(auth.uid()) AND (EXISTS ( SELECT 1
   FROM (negociacoes n
     JOIN user_empreendimentos ue ON ((ue.empreendimento_id = n.empreendimento_id)))
  WHERE ((n.id = negociacao_comentarios.negociacao_id) AND (ue.user_id = auth.uid()))))));
DROP POLICY IF EXISTS "Admins can manage negociacao_condicoes_pagamento" ON public.negociacao_condicoes_pagamento;
CREATE POLICY "Admins can manage negociacao_condicoes_pagamento" ON public.negociacao_condicoes_pagamento AS PERMISSIVE FOR ALL TO public USING (is_admin(auth.uid()));
DROP POLICY IF EXISTS "Gestores can manage negociacao_condicoes_pagamento" ON public.negociacao_condicoes_pagamento;
CREATE POLICY "Gestores can manage negociacao_condicoes_pagamento" ON public.negociacao_condicoes_pagamento AS PERMISSIVE FOR ALL TO public USING (has_role(auth.uid(), 'gestor_produto'::text));
DROP POLICY IF EXISTS "Users can insert negociacao_condicoes_pagamento" ON public.negociacao_condicoes_pagamento;
CREATE POLICY "Users can insert negociacao_condicoes_pagamento" ON public.negociacao_condicoes_pagamento AS PERMISSIVE FOR INSERT TO public WITH CHECK (true);
DROP POLICY IF EXISTS "Users can update negociacao_condicoes_pagamento" ON public.negociacao_condicoes_pagamento;
CREATE POLICY "Users can update negociacao_condicoes_pagamento" ON public.negociacao_condicoes_pagamento AS PERMISSIVE FOR UPDATE TO public USING (true);
DROP POLICY IF EXISTS "Users can view negociacao_condicoes_pagamento" ON public.negociacao_condicoes_pagamento;
CREATE POLICY "Users can view negociacao_condicoes_pagamento" ON public.negociacao_condicoes_pagamento AS PERMISSIVE FOR SELECT TO authenticated USING (can_view_negociacao_condicoes(negociacao_id));
DROP POLICY IF EXISTS "Authenticated users can insert dacao anexos" ON public.negociacao_dacao_anexos;
CREATE POLICY "Authenticated users can insert dacao anexos" ON public.negociacao_dacao_anexos AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((auth.uid() = created_by));
DROP POLICY IF EXISTS "Authenticated users can view dacao anexos" ON public.negociacao_dacao_anexos;
CREATE POLICY "Authenticated users can view dacao anexos" ON public.negociacao_dacao_anexos AS PERMISSIVE FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Users can delete their own dacao anexos" ON public.negociacao_dacao_anexos;
CREATE POLICY "Users can delete their own dacao anexos" ON public.negociacao_dacao_anexos AS PERMISSIVE FOR DELETE TO authenticated USING ((auth.uid() = created_by));
DROP POLICY IF EXISTS "Users can update their own dacao anexos" ON public.negociacao_dacao_anexos;
CREATE POLICY "Users can update their own dacao anexos" ON public.negociacao_dacao_anexos AS PERMISSIVE FOR UPDATE TO authenticated USING ((auth.uid() = created_by));
DROP POLICY IF EXISTS "Admins can manage negociacao_historico" ON public.negociacao_historico;
CREATE POLICY "Admins can manage negociacao_historico" ON public.negociacao_historico AS PERMISSIVE FOR ALL TO public USING (is_admin(auth.uid()));
DROP POLICY IF EXISTS "Gestores can manage negociacao_historico" ON public.negociacao_historico;
CREATE POLICY "Gestores can manage negociacao_historico" ON public.negociacao_historico AS PERMISSIVE FOR ALL TO public USING (has_role(auth.uid(), 'gestor_produto'::app_role));
DROP POLICY IF EXISTS "Users can insert negociacao_historico" ON public.negociacao_historico;
CREATE POLICY "Users can insert negociacao_historico" ON public.negociacao_historico AS PERMISSIVE FOR INSERT TO public WITH CHECK (true);
DROP POLICY IF EXISTS "Users can view negociacao_historico" ON public.negociacao_historico;
CREATE POLICY "Users can view negociacao_historico" ON public.negociacao_historico AS PERMISSIVE FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM negociacoes n
  WHERE ((n.id = negociacao_historico.negociacao_id) AND (is_admin(auth.uid()) OR has_role(auth.uid(), 'gestor_produto'::text) OR (n.corretor_id IN ( SELECT get_corretor_ids_by_user(auth.uid()) AS get_corretor_ids_by_user)))))));
DROP POLICY IF EXISTS "Admins can manage negociacao_unidades" ON public.negociacao_unidades;
CREATE POLICY "Admins can manage negociacao_unidades" ON public.negociacao_unidades AS PERMISSIVE FOR ALL TO public USING (is_admin(auth.uid()));
DROP POLICY IF EXISTS "Gestores can manage negociacao_unidades" ON public.negociacao_unidades;
CREATE POLICY "Gestores can manage negociacao_unidades" ON public.negociacao_unidades AS PERMISSIVE FOR ALL TO public USING (has_role(auth.uid(), 'gestor_produto'::app_role));
DROP POLICY IF EXISTS "Gestores delete itens pendentes" ON public.negociacao_unidades;
CREATE POLICY "Gestores delete itens pendentes" ON public.negociacao_unidades AS PERMISSIVE FOR DELETE TO authenticated USING ((EXISTS ( SELECT 1
   FROM negociacoes n
  WHERE ((n.id = negociacao_unidades.negociacao_id) AND ((n.status_aprovacao = 'pendente'::text) OR (n.status_aprovacao IS NULL)) AND (is_admin(auth.uid()) OR has_role(auth.uid(), 'gestor_produto'::app_role))))));
DROP POLICY IF EXISTS "Incorporadores can view negociacao_unidades from linked empreen" ON public.negociacao_unidades;
CREATE POLICY "Incorporadores can view negociacao_unidades from linked empreen" ON public.negociacao_unidades AS PERMISSIVE FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM negociacoes n
  WHERE ((n.id = negociacao_unidades.negociacao_id) AND is_incorporador(auth.uid()) AND user_has_empreendimento_access(auth.uid(), n.empreendimento_id)))));
DROP POLICY IF EXISTS "Users can insert negociacao_unidades" ON public.negociacao_unidades;
CREATE POLICY "Users can insert negociacao_unidades" ON public.negociacao_unidades AS PERMISSIVE FOR INSERT TO public WITH CHECK (true);
DROP POLICY IF EXISTS "Users can view negociacao_unidades" ON public.negociacao_unidades;
CREATE POLICY "Users can view negociacao_unidades" ON public.negociacao_unidades AS PERMISSIVE FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM negociacoes n
  WHERE ((n.id = negociacao_unidades.negociacao_id) AND (is_admin(auth.uid()) OR has_role(auth.uid(), 'gestor_produto'::text) OR (n.corretor_id IN ( SELECT get_corretor_ids_by_user(auth.uid()) AS get_corretor_ids_by_user)))))));
DROP POLICY IF EXISTS "Admins can manage negociacoes" ON public.negociacoes;
CREATE POLICY "Admins can manage negociacoes" ON public.negociacoes AS PERMISSIVE FOR ALL TO public USING (is_admin(auth.uid()));
DROP POLICY IF EXISTS "Corretores can create negociacoes" ON public.negociacoes;
CREATE POLICY "Corretores can create negociacoes" ON public.negociacoes AS PERMISSIVE FOR INSERT TO public WITH CHECK (true);
DROP POLICY IF EXISTS "Corretores can update own negociacoes" ON public.negociacoes;
CREATE POLICY "Corretores can update own negociacoes" ON public.negociacoes AS PERMISSIVE FOR UPDATE TO authenticated USING ((corretor_id IN ( SELECT get_corretor_ids_by_user(auth.uid()) AS get_corretor_ids_by_user)));
DROP POLICY IF EXISTS "Corretores can view own negociacoes" ON public.negociacoes;
CREATE POLICY "Corretores can view own negociacoes" ON public.negociacoes AS PERMISSIVE FOR SELECT TO authenticated USING ((corretor_id IN ( SELECT get_corretor_ids_by_user(auth.uid()) AS get_corretor_ids_by_user)));
DROP POLICY IF EXISTS "Corretores insert pendente only" ON public.negociacoes;
CREATE POLICY "Corretores insert pendente only" ON public.negociacoes AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (((status_aprovacao = 'pendente'::text) OR (status_aprovacao IS NULL) OR is_admin(auth.uid()) OR has_role(auth.uid(), 'gestor_produto'::app_role)));
DROP POLICY IF EXISTS "Gestores can delete own negociacoes" ON public.negociacoes;
CREATE POLICY "Gestores can delete own negociacoes" ON public.negociacoes AS PERMISSIVE FOR DELETE TO authenticated USING ((has_role(auth.uid(), 'gestor_produto'::text) AND (gestor_id = auth.uid())));
DROP POLICY IF EXISTS "Gestores can insert own negociacoes" ON public.negociacoes;
CREATE POLICY "Gestores can insert own negociacoes" ON public.negociacoes AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((has_role(auth.uid(), 'gestor_produto'::text) AND (gestor_id = auth.uid())));
DROP POLICY IF EXISTS "Gestores can update own negociacoes" ON public.negociacoes;
CREATE POLICY "Gestores can update own negociacoes" ON public.negociacoes AS PERMISSIVE FOR UPDATE TO authenticated USING ((has_role(auth.uid(), 'gestor_produto'::text) AND (gestor_id = auth.uid())));
DROP POLICY IF EXISTS "Gestores can view own negociacoes" ON public.negociacoes;
CREATE POLICY "Gestores can view own negociacoes" ON public.negociacoes AS PERMISSIVE FOR SELECT TO authenticated USING ((has_role(auth.uid(), 'gestor_produto'::text) AND (gestor_id = auth.uid())));
DROP POLICY IF EXISTS "Gestores update aprovacao" ON public.negociacoes;
CREATE POLICY "Gestores update aprovacao" ON public.negociacoes AS PERMISSIVE FOR UPDATE TO authenticated USING ((is_admin(auth.uid()) OR has_role(auth.uid(), 'gestor_produto'::app_role) OR user_has_empreendimento_access(auth.uid(), empreendimento_id)));
DROP POLICY IF EXISTS "Incorporadores can view negociacoes from linked empreendimentos" ON public.negociacoes;
CREATE POLICY "Incorporadores can view negociacoes from linked empreendimentos" ON public.negociacoes AS PERMISSIVE FOR SELECT TO authenticated USING ((is_incorporador(auth.uid()) AND user_has_empreendimento_access(auth.uid(), empreendimento_id)));
DROP POLICY IF EXISTS "Authenticated users can insert notifications" ON public.notificacoes;
CREATE POLICY "Authenticated users can insert notifications" ON public.notificacoes AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notificacoes;
CREATE POLICY "Users can delete own notifications" ON public.notificacoes AS PERMISSIVE FOR DELETE TO authenticated USING ((auth.uid() = user_id));
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notificacoes;
CREATE POLICY "Users can update own notifications" ON public.notificacoes AS PERMISSIVE FOR UPDATE TO authenticated USING ((auth.uid() = user_id));
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notificacoes;
CREATE POLICY "Users can view own notifications" ON public.notificacoes AS PERMISSIVE FOR SELECT TO authenticated USING ((auth.uid() = user_id));
DROP POLICY IF EXISTS "Admins can delete planejamento_fases" ON public.planejamento_fases;
CREATE POLICY "Admins can delete planejamento_fases" ON public.planejamento_fases AS PERMISSIVE FOR DELETE TO authenticated USING (is_admin(auth.uid()));
DROP POLICY IF EXISTS "Admins can insert planejamento_fases" ON public.planejamento_fases;
CREATE POLICY "Admins can insert planejamento_fases" ON public.planejamento_fases AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (is_admin(auth.uid()));
DROP POLICY IF EXISTS "Admins can update planejamento_fases" ON public.planejamento_fases;
CREATE POLICY "Admins can update planejamento_fases" ON public.planejamento_fases AS PERMISSIVE FOR UPDATE TO authenticated USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));
DROP POLICY IF EXISTS planejamento_fases_all ON public.planejamento_fases;
CREATE POLICY planejamento_fases_all ON public.planejamento_fases AS PERMISSIVE FOR ALL TO public USING (is_seven_team(auth.uid()));
DROP POLICY IF EXISTS planejamento_fases_select ON public.planejamento_fases;
CREATE POLICY planejamento_fases_select ON public.planejamento_fases AS PERMISSIVE FOR SELECT TO public USING (true);
DROP POLICY IF EXISTS planejamento_historico_incorporador_select ON public.planejamento_historico;
CREATE POLICY planejamento_historico_incorporador_select ON public.planejamento_historico AS PERMISSIVE FOR SELECT TO public USING ((item_id IN ( SELECT planejamento_itens.id
   FROM planejamento_itens
  WHERE (planejamento_itens.empreendimento_id IN ( SELECT user_empreendimentos.empreendimento_id
           FROM user_empreendimentos
          WHERE (user_empreendimentos.user_id = auth.uid()))))));
DROP POLICY IF EXISTS planejamento_historico_seven ON public.planejamento_historico;
CREATE POLICY planejamento_historico_seven ON public.planejamento_historico AS PERMISSIVE FOR ALL TO public USING (is_seven_team(auth.uid()));
DROP POLICY IF EXISTS "Admins podem atualizar responsaveis" ON public.planejamento_item_responsaveis;
CREATE POLICY "Admins podem atualizar responsaveis" ON public.planejamento_item_responsaveis AS PERMISSIVE FOR UPDATE TO authenticated USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));
DROP POLICY IF EXISTS "Admins podem deletar responsaveis" ON public.planejamento_item_responsaveis;
CREATE POLICY "Admins podem deletar responsaveis" ON public.planejamento_item_responsaveis AS PERMISSIVE FOR DELETE TO authenticated USING (is_admin(auth.uid()));
DROP POLICY IF EXISTS "Admins podem inserir responsaveis" ON public.planejamento_item_responsaveis;
CREATE POLICY "Admins podem inserir responsaveis" ON public.planejamento_item_responsaveis AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (is_admin(auth.uid()));
DROP POLICY IF EXISTS "Leitura liberada para autenticados" ON public.planejamento_item_responsaveis;
CREATE POLICY "Leitura liberada para autenticados" ON public.planejamento_item_responsaveis AS PERMISSIVE FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Admins can delete planejamento_itens" ON public.planejamento_itens;
CREATE POLICY "Admins can delete planejamento_itens" ON public.planejamento_itens AS PERMISSIVE FOR DELETE TO authenticated USING (is_admin(auth.uid()));
DROP POLICY IF EXISTS "Admins can insert planejamento_itens" ON public.planejamento_itens;
CREATE POLICY "Admins can insert planejamento_itens" ON public.planejamento_itens AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (is_admin(auth.uid()));
DROP POLICY IF EXISTS "Admins can update planejamento_itens" ON public.planejamento_itens;
CREATE POLICY "Admins can update planejamento_itens" ON public.planejamento_itens AS PERMISSIVE FOR UPDATE TO authenticated USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));
DROP POLICY IF EXISTS planejamento_itens_incorporador_select ON public.planejamento_itens;
CREATE POLICY planejamento_itens_incorporador_select ON public.planejamento_itens AS PERMISSIVE FOR SELECT TO public USING ((is_incorporador(auth.uid()) AND (empreendimento_id IN ( SELECT user_empreendimentos.empreendimento_id
   FROM user_empreendimentos
  WHERE (user_empreendimentos.user_id = auth.uid())))));
DROP POLICY IF EXISTS planejamento_itens_seven ON public.planejamento_itens;
CREATE POLICY planejamento_itens_seven ON public.planejamento_itens AS PERMISSIVE FOR ALL TO public USING (is_seven_team(auth.uid()));
DROP POLICY IF EXISTS "Admins can delete planejamento_status" ON public.planejamento_status;
CREATE POLICY "Admins can delete planejamento_status" ON public.planejamento_status AS PERMISSIVE FOR DELETE TO authenticated USING (is_admin(auth.uid()));
DROP POLICY IF EXISTS "Admins can insert planejamento_status" ON public.planejamento_status;
CREATE POLICY "Admins can insert planejamento_status" ON public.planejamento_status AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (is_admin(auth.uid()));
DROP POLICY IF EXISTS "Admins can update planejamento_status" ON public.planejamento_status;
CREATE POLICY "Admins can update planejamento_status" ON public.planejamento_status AS PERMISSIVE FOR UPDATE TO authenticated USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));
DROP POLICY IF EXISTS planejamento_status_all ON public.planejamento_status;
CREATE POLICY planejamento_status_all ON public.planejamento_status AS PERMISSIVE FOR ALL TO public USING (is_seven_team(auth.uid()));
DROP POLICY IF EXISTS planejamento_status_select ON public.planejamento_status;
CREATE POLICY planejamento_status_select ON public.planejamento_status AS PERMISSIVE FOR SELECT TO public USING (true);
DROP POLICY IF EXISTS "Admins can manage plano_contas" ON public.plano_contas;
CREATE POLICY "Admins can manage plano_contas" ON public.plano_contas AS PERMISSIVE FOR ALL TO public USING (is_admin(auth.uid()));
DROP POLICY IF EXISTS "Anyone can view plano_contas" ON public.plano_contas;
CREATE POLICY "Anyone can view plano_contas" ON public.plano_contas AS PERMISSIVE FOR SELECT TO public USING (true);
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;
CREATE POLICY "Admins can delete profiles" ON public.profiles AS PERMISSIVE FOR DELETE TO authenticated USING (is_admin(auth.uid()));
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
CREATE POLICY "Admins can update any profile" ON public.profiles AS PERMISSIVE FOR UPDATE TO authenticated USING (is_admin(auth.uid()));
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles AS PERMISSIVE FOR SELECT TO authenticated USING (is_admin(auth.uid()));
DROP POLICY IF EXISTS "Marketing supervisors can view all profiles" ON public.profiles;
CREATE POLICY "Marketing supervisors can view all profiles" ON public.profiles AS PERMISSIVE FOR SELECT TO authenticated USING (is_marketing_supervisor(auth.uid()));
DROP POLICY IF EXISTS "System can insert profiles" ON public.profiles;
CREATE POLICY "System can insert profiles" ON public.profiles AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles AS PERMISSIVE FOR UPDATE TO authenticated USING ((id = auth.uid())) WITH CHECK ((id = auth.uid()));
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles AS PERMISSIVE FOR SELECT TO authenticated USING ((id = auth.uid()));
DROP POLICY IF EXISTS "Admins can manage projeto_comentarios" ON public.projeto_comentarios;
CREATE POLICY "Admins can manage projeto_comentarios" ON public.projeto_comentarios AS PERMISSIVE FOR ALL TO public USING (is_admin(auth.uid()));
DROP POLICY IF EXISTS "Supervisores can manage projeto_comentarios" ON public.projeto_comentarios;
CREATE POLICY "Supervisores can manage projeto_comentarios" ON public.projeto_comentarios AS PERMISSIVE FOR ALL TO public USING (is_marketing_supervisor(auth.uid()));
DROP POLICY IF EXISTS "Users can create comentarios on visible projetos" ON public.projeto_comentarios;
CREATE POLICY "Users can create comentarios on visible projetos" ON public.projeto_comentarios AS PERMISSIVE FOR INSERT TO public WITH CHECK ((EXISTS ( SELECT 1
   FROM projetos_marketing pm
  WHERE ((pm.id = projeto_comentarios.projeto_id) AND ((pm.cliente_id = auth.uid()) OR is_admin(auth.uid()) OR is_marketing_supervisor(auth.uid()))))));
DROP POLICY IF EXISTS "Users can view comentarios of visible projetos" ON public.projeto_comentarios;
CREATE POLICY "Users can view comentarios of visible projetos" ON public.projeto_comentarios AS PERMISSIVE FOR SELECT TO public USING ((EXISTS ( SELECT 1
   FROM projetos_marketing pm
  WHERE ((pm.id = projeto_comentarios.projeto_id) AND ((pm.cliente_id = auth.uid()) OR is_admin(auth.uid()) OR is_marketing_supervisor(auth.uid()))))));
DROP POLICY IF EXISTS "Admins can manage projeto_historico" ON public.projeto_historico;
CREATE POLICY "Admins can manage projeto_historico" ON public.projeto_historico AS PERMISSIVE FOR ALL TO public USING (is_admin(auth.uid()));
DROP POLICY IF EXISTS "Supervisores can manage projeto_historico" ON public.projeto_historico;
CREATE POLICY "Supervisores can manage projeto_historico" ON public.projeto_historico AS PERMISSIVE FOR ALL TO public USING (is_marketing_supervisor(auth.uid()));
DROP POLICY IF EXISTS "Users can view historico of visible projetos" ON public.projeto_historico;
CREATE POLICY "Users can view historico of visible projetos" ON public.projeto_historico AS PERMISSIVE FOR SELECT TO public USING ((EXISTS ( SELECT 1
   FROM projetos_marketing pm
  WHERE ((pm.id = projeto_historico.projeto_id) AND ((pm.cliente_id = auth.uid()) OR is_admin(auth.uid()) OR is_marketing_supervisor(auth.uid()))))));
DROP POLICY IF EXISTS "Authenticated users can delete projeto_responsaveis" ON public.projeto_responsaveis;
CREATE POLICY "Authenticated users can delete projeto_responsaveis" ON public.projeto_responsaveis AS PERMISSIVE FOR DELETE TO authenticated USING (true);
DROP POLICY IF EXISTS "Authenticated users can insert projeto_responsaveis" ON public.projeto_responsaveis;
CREATE POLICY "Authenticated users can insert projeto_responsaveis" ON public.projeto_responsaveis AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Authenticated users can view projeto_responsaveis" ON public.projeto_responsaveis;
CREATE POLICY "Authenticated users can view projeto_responsaveis" ON public.projeto_responsaveis AS PERMISSIVE FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Admins can manage projetos_marketing" ON public.projetos_marketing;
CREATE POLICY "Admins can manage projetos_marketing" ON public.projetos_marketing AS PERMISSIVE FOR ALL TO public USING (is_admin(auth.uid()));
DROP POLICY IF EXISTS "Clientes can create projetos" ON public.projetos_marketing;
CREATE POLICY "Clientes can create projetos" ON public.projetos_marketing AS PERMISSIVE FOR INSERT TO public WITH CHECK ((is_cliente_externo(auth.uid()) AND (cliente_id = auth.uid())));
DROP POLICY IF EXISTS "Clientes can view own projetos" ON public.projetos_marketing;
CREATE POLICY "Clientes can view own projetos" ON public.projetos_marketing AS PERMISSIVE FOR SELECT TO public USING ((cliente_id = auth.uid()));
DROP POLICY IF EXISTS "Incorporadores can view tickets of their empreendimentos" ON public.projetos_marketing;
CREATE POLICY "Incorporadores can view tickets of their empreendimentos" ON public.projetos_marketing AS PERMISSIVE FOR SELECT TO authenticated USING ((is_incorporador(auth.uid()) AND (empreendimento_id IN ( SELECT user_empreendimentos.empreendimento_id
   FROM user_empreendimentos
  WHERE (user_empreendimentos.user_id = auth.uid())))));
DROP POLICY IF EXISTS "Supervisores can manage projetos_marketing" ON public.projetos_marketing;
CREATE POLICY "Supervisores can manage projetos_marketing" ON public.projetos_marketing AS PERMISSIVE FOR ALL TO public USING (is_marketing_supervisor(auth.uid()));
DROP POLICY IF EXISTS "Usuarios autenticados podem atualizar condicoes da proposta" ON public.proposta_condicoes_pagamento;
CREATE POLICY "Usuarios autenticados podem atualizar condicoes da proposta" ON public.proposta_condicoes_pagamento AS PERMISSIVE FOR UPDATE TO authenticated USING (true);
DROP POLICY IF EXISTS "Usuarios autenticados podem deletar condicoes da proposta" ON public.proposta_condicoes_pagamento;
CREATE POLICY "Usuarios autenticados podem deletar condicoes da proposta" ON public.proposta_condicoes_pagamento AS PERMISSIVE FOR DELETE TO authenticated USING (true);
DROP POLICY IF EXISTS "Usuarios autenticados podem inserir condicoes da proposta" ON public.proposta_condicoes_pagamento;
CREATE POLICY "Usuarios autenticados podem inserir condicoes da proposta" ON public.proposta_condicoes_pagamento AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Usuarios autenticados podem ver condicoes da proposta" ON public.proposta_condicoes_pagamento;
CREATE POLICY "Usuarios autenticados podem ver condicoes da proposta" ON public.proposta_condicoes_pagamento AS PERMISSIVE FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Usuarios autenticados podem inserir unidades da proposta" ON public.proposta_unidades;
CREATE POLICY "Usuarios autenticados podem inserir unidades da proposta" ON public.proposta_unidades AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Usuarios autenticados podem ver unidades da proposta" ON public.proposta_unidades;
CREATE POLICY "Usuarios autenticados podem ver unidades da proposta" ON public.proposta_unidades AS PERMISSIVE FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Admins e gestores podem excluir propostas" ON public.propostas;
CREATE POLICY "Admins e gestores podem excluir propostas" ON public.propostas AS PERMISSIVE FOR UPDATE TO authenticated USING (((is_active = true) AND (is_super_admin(auth.uid()) OR is_admin(auth.uid()) OR (gestor_id = auth.uid())))) WITH CHECK (true);
DROP POLICY IF EXISTS "Super admin pode atualizar propostas" ON public.propostas;
CREATE POLICY "Super admin pode atualizar propostas" ON public.propostas AS PERMISSIVE FOR UPDATE TO authenticated USING (is_super_admin(auth.uid())) WITH CHECK (true);
DROP POLICY IF EXISTS "Usuarios autenticados podem inserir propostas" ON public.propostas;
CREATE POLICY "Usuarios autenticados podem inserir propostas" ON public.propostas AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Usuarios autenticados podem ver propostas ativas" ON public.propostas;
CREATE POLICY "Usuarios autenticados podem ver propostas ativas" ON public.propostas AS PERMISSIVE FOR SELECT TO authenticated USING ((is_active = true));
DROP POLICY IF EXISTS "Usuarios podem atualizar campos de propostas" ON public.propostas;
CREATE POLICY "Usuarios podem atualizar campos de propostas" ON public.propostas AS PERMISSIVE FOR UPDATE TO authenticated USING (((is_active = true) AND (auth.uid() IS NOT NULL))) WITH CHECK ((is_active = true));
DROP POLICY IF EXISTS "Admins can manage reserva_documentos" ON public.reserva_documentos;
CREATE POLICY "Admins can manage reserva_documentos" ON public.reserva_documentos AS PERMISSIVE FOR ALL TO public USING (is_admin(auth.uid()));
DROP POLICY IF EXISTS "Gestores can manage reserva_documentos" ON public.reserva_documentos;
CREATE POLICY "Gestores can manage reserva_documentos" ON public.reserva_documentos AS PERMISSIVE FOR ALL TO public USING (has_role(auth.uid(), 'gestor_produto'::app_role));
DROP POLICY IF EXISTS "Users can insert reserva_documentos" ON public.reserva_documentos;
CREATE POLICY "Users can insert reserva_documentos" ON public.reserva_documentos AS PERMISSIVE FOR INSERT TO public WITH CHECK (true);
DROP POLICY IF EXISTS "Admins can manage permissions" ON public.role_permissions;
CREATE POLICY "Admins can manage permissions" ON public.role_permissions AS PERMISSIVE FOR ALL TO authenticated USING (is_admin(auth.uid()));
DROP POLICY IF EXISTS "Authenticated users can view permissions" ON public.role_permissions;
CREATE POLICY "Authenticated users can view permissions" ON public.role_permissions AS PERMISSIVE FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Admins can manage roles" ON public.roles;
CREATE POLICY "Admins can manage roles" ON public.roles AS PERMISSIVE FOR ALL TO public USING (is_admin(auth.uid()));
DROP POLICY IF EXISTS "Anyone can view active roles" ON public.roles;
CREATE POLICY "Anyone can view active roles" ON public.roles AS PERMISSIVE FOR SELECT TO public USING ((is_active = true));
DROP POLICY IF EXISTS "Admins can manage saldos_mensais" ON public.saldos_mensais;
CREATE POLICY "Admins can manage saldos_mensais" ON public.saldos_mensais AS PERMISSIVE FOR ALL TO public USING (is_admin(auth.uid()));
DROP POLICY IF EXISTS "Gestores can manage saldos_mensais" ON public.saldos_mensais;
CREATE POLICY "Gestores can manage saldos_mensais" ON public.saldos_mensais AS PERMISSIVE FOR ALL TO public USING (has_role(auth.uid(), 'gestor_produto'::app_role));
DROP POLICY IF EXISTS "Users can view saldos_mensais" ON public.saldos_mensais;
CREATE POLICY "Users can view saldos_mensais" ON public.saldos_mensais AS PERMISSIVE FOR SELECT TO public USING (true);
DROP POLICY IF EXISTS "Admins can manage tarefas_projeto" ON public.tarefas_projeto;
CREATE POLICY "Admins can manage tarefas_projeto" ON public.tarefas_projeto AS PERMISSIVE FOR ALL TO public USING (is_admin(auth.uid()));
DROP POLICY IF EXISTS "Supervisores can manage tarefas_projeto" ON public.tarefas_projeto;
CREATE POLICY "Supervisores can manage tarefas_projeto" ON public.tarefas_projeto AS PERMISSIVE FOR ALL TO public USING (is_marketing_supervisor(auth.uid()));
DROP POLICY IF EXISTS "Users can view tarefas of visible projetos" ON public.tarefas_projeto;
CREATE POLICY "Users can view tarefas of visible projetos" ON public.tarefas_projeto AS PERMISSIVE FOR SELECT TO public USING ((EXISTS ( SELECT 1
   FROM projetos_marketing pm
  WHERE ((pm.id = tarefas_projeto.projeto_id) AND ((pm.cliente_id = auth.uid()) OR is_admin(auth.uid()) OR is_marketing_supervisor(auth.uid()))))));
DROP POLICY IF EXISTS "Admins can manage template_condicoes_pagamento" ON public.template_condicoes_pagamento;
CREATE POLICY "Admins can manage template_condicoes_pagamento" ON public.template_condicoes_pagamento AS PERMISSIVE FOR ALL TO public USING (is_admin(auth.uid()));
DROP POLICY IF EXISTS "Gestores can manage template_condicoes_pagamento" ON public.template_condicoes_pagamento;
CREATE POLICY "Gestores can manage template_condicoes_pagamento" ON public.template_condicoes_pagamento AS PERMISSIVE FOR ALL TO public USING (has_role(auth.uid(), 'gestor_produto'::app_role));
DROP POLICY IF EXISTS "Users can view template_condicoes_pagamento" ON public.template_condicoes_pagamento;
CREATE POLICY "Users can view template_condicoes_pagamento" ON public.template_condicoes_pagamento AS PERMISSIVE FOR SELECT TO public USING ((EXISTS ( SELECT 1
   FROM contrato_templates t
  WHERE ((t.id = template_condicoes_pagamento.template_id) AND (t.is_active = true)))));
DROP POLICY IF EXISTS "Admins veem todos aceites" ON public.termos_aceites;
CREATE POLICY "Admins veem todos aceites" ON public.termos_aceites AS PERMISSIVE FOR SELECT TO public USING ((EXISTS ( SELECT 1
   FROM (user_roles ur
     JOIN roles r ON ((ur.role_id = r.id)))
  WHERE ((ur.user_id = auth.uid()) AND (r.name = ANY (ARRAY['super_admin'::text, 'admin'::text]))))));
DROP POLICY IF EXISTS "Usuários registram próprio aceite" ON public.termos_aceites;
CREATE POLICY "Usuários registram próprio aceite" ON public.termos_aceites AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
DROP POLICY IF EXISTS "Usuários veem próprios aceites" ON public.termos_aceites;
CREATE POLICY "Usuários veem próprios aceites" ON public.termos_aceites AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));
DROP POLICY IF EXISTS "Admins criam versões" ON public.termos_versoes;
CREATE POLICY "Admins criam versões" ON public.termos_versoes AS PERMISSIVE FOR INSERT TO public WITH CHECK ((EXISTS ( SELECT 1
   FROM (user_roles ur
     JOIN roles r ON ((ur.role_id = r.id)))
  WHERE ((ur.user_id = auth.uid()) AND (r.name = ANY (ARRAY['super_admin'::text, 'admin'::text]))))));
DROP POLICY IF EXISTS "Usuários veem versões" ON public.termos_versoes;
CREATE POLICY "Usuários veem versões" ON public.termos_versoes AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() IS NOT NULL));
DROP POLICY IF EXISTS "Admins podem tudo em criativos" ON public.ticket_criativos;
CREATE POLICY "Admins podem tudo em criativos" ON public.ticket_criativos AS PERMISSIVE FOR ALL TO public USING (is_admin(auth.uid()));
DROP POLICY IF EXISTS "Marketing supervisors podem gerenciar criativos" ON public.ticket_criativos;
CREATE POLICY "Marketing supervisors podem gerenciar criativos" ON public.ticket_criativos AS PERMISSIVE FOR ALL TO public USING (is_marketing_supervisor(auth.uid()));
DROP POLICY IF EXISTS "Usuários autenticados podem visualizar criativos" ON public.ticket_criativos;
CREATE POLICY "Usuários autenticados podem visualizar criativos" ON public.ticket_criativos AS PERMISSIVE FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Admins can view ticket_etapas" ON public.ticket_etapas;
CREATE POLICY "Admins can view ticket_etapas" ON public.ticket_etapas AS PERMISSIVE FOR SELECT TO public USING (is_admin(auth.uid()));
DROP POLICY IF EXISTS "Super admins can manage ticket_etapas" ON public.ticket_etapas;
CREATE POLICY "Super admins can manage ticket_etapas" ON public.ticket_etapas AS PERMISSIVE FOR ALL TO public USING (is_super_admin(auth.uid()));
DROP POLICY IF EXISTS "Users can view active ticket_etapas" ON public.ticket_etapas;
CREATE POLICY "Users can view active ticket_etapas" ON public.ticket_etapas AS PERMISSIVE FOR SELECT TO public USING ((is_active = true));
DROP POLICY IF EXISTS "Admins can manage tipologias" ON public.tipologias;
CREATE POLICY "Admins can manage tipologias" ON public.tipologias AS PERMISSIVE FOR ALL TO public USING (is_admin(auth.uid()));
DROP POLICY IF EXISTS "Gestores can manage tipologias" ON public.tipologias;
CREATE POLICY "Gestores can manage tipologias" ON public.tipologias AS PERMISSIVE FOR ALL TO public USING (has_role(auth.uid(), 'gestor_produto'::app_role));
DROP POLICY IF EXISTS "Users can view tipologias of authorized empreendimentos" ON public.tipologias;
CREATE POLICY "Users can view tipologias of authorized empreendimentos" ON public.tipologias AS PERMISSIVE FOR SELECT TO public USING (user_has_empreendimento_access(auth.uid(), empreendimento_id));
DROP POLICY IF EXISTS "Apenas admin pode atualizar tipos atendimento" ON public.tipos_atendimento_config;
CREATE POLICY "Apenas admin pode atualizar tipos atendimento" ON public.tipos_atendimento_config AS PERMISSIVE FOR UPDATE TO public USING (is_admin(auth.uid()));
DROP POLICY IF EXISTS "Apenas admin pode deletar tipos atendimento" ON public.tipos_atendimento_config;
CREATE POLICY "Apenas admin pode deletar tipos atendimento" ON public.tipos_atendimento_config AS PERMISSIVE FOR DELETE TO public USING (is_admin(auth.uid()));
DROP POLICY IF EXISTS "Apenas admin pode inserir tipos atendimento" ON public.tipos_atendimento_config;
CREATE POLICY "Apenas admin pode inserir tipos atendimento" ON public.tipos_atendimento_config AS PERMISSIVE FOR INSERT TO public WITH CHECK (is_admin(auth.uid()));
DROP POLICY IF EXISTS "Tipos atendimento visíveis para autenticados" ON public.tipos_atendimento_config;
CREATE POLICY "Tipos atendimento visíveis para autenticados" ON public.tipos_atendimento_config AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() IS NOT NULL));
DROP POLICY IF EXISTS "Admins can manage tipos_parcela" ON public.tipos_parcela;
CREATE POLICY "Admins can manage tipos_parcela" ON public.tipos_parcela AS PERMISSIVE FOR ALL TO public USING (is_admin(auth.uid()));
DROP POLICY IF EXISTS "Anyone can view active tipos_parcela" ON public.tipos_parcela;
CREATE POLICY "Anyone can view active tipos_parcela" ON public.tipos_parcela AS PERMISSIVE FOR SELECT TO public USING ((is_active = true));
DROP POLICY IF EXISTS "Admins can manage unidade_historico_precos" ON public.unidade_historico_precos;
CREATE POLICY "Admins can manage unidade_historico_precos" ON public.unidade_historico_precos AS PERMISSIVE FOR ALL TO public USING (is_admin(auth.uid()));
DROP POLICY IF EXISTS "Gestores can manage unidade_historico_precos" ON public.unidade_historico_precos;
CREATE POLICY "Gestores can manage unidade_historico_precos" ON public.unidade_historico_precos AS PERMISSIVE FOR ALL TO public USING (has_role(auth.uid(), 'gestor_produto'::app_role));
DROP POLICY IF EXISTS "Users can insert unidade_historico_precos" ON public.unidade_historico_precos;
CREATE POLICY "Users can insert unidade_historico_precos" ON public.unidade_historico_precos AS PERMISSIVE FOR INSERT TO public WITH CHECK (true);
DROP POLICY IF EXISTS "Users can view unidade_historico_precos" ON public.unidade_historico_precos;
CREATE POLICY "Users can view unidade_historico_precos" ON public.unidade_historico_precos AS PERMISSIVE FOR SELECT TO public USING ((EXISTS ( SELECT 1
   FROM unidades u
  WHERE ((u.id = unidade_historico_precos.unidade_id) AND user_has_empreendimento_access(auth.uid(), u.empreendimento_id)))));
DROP POLICY IF EXISTS "Admins can manage unidades" ON public.unidades;
CREATE POLICY "Admins can manage unidades" ON public.unidades AS PERMISSIVE FOR ALL TO public USING (is_admin(auth.uid()));
DROP POLICY IF EXISTS "Gestores can manage unidades" ON public.unidades;
CREATE POLICY "Gestores can manage unidades" ON public.unidades AS PERMISSIVE FOR ALL TO public USING (has_role(auth.uid(), 'gestor_produto'::app_role));
DROP POLICY IF EXISTS "Users can view unidades of authorized empreendimentos" ON public.unidades;
CREATE POLICY "Users can view unidades of authorized empreendimentos" ON public.unidades AS PERMISSIVE FOR SELECT TO public USING (user_has_empreendimento_access(auth.uid(), empreendimento_id));
DROP POLICY IF EXISTS "Admins can manage empreendimento links" ON public.user_empreendimentos;
CREATE POLICY "Admins can manage empreendimento links" ON public.user_empreendimentos AS PERMISSIVE FOR ALL TO authenticated USING (is_admin(auth.uid()));
DROP POLICY IF EXISTS "Admins can view all empreendimento links" ON public.user_empreendimentos;
CREATE POLICY "Admins can view all empreendimento links" ON public.user_empreendimentos AS PERMISSIVE FOR SELECT TO authenticated USING (is_admin(auth.uid()));
DROP POLICY IF EXISTS "Users can view their own empreendimento links" ON public.user_empreendimentos;
CREATE POLICY "Users can view their own empreendimento links" ON public.user_empreendimentos AS PERMISSIVE FOR SELECT TO authenticated USING ((user_id = auth.uid()));
DROP POLICY IF EXISTS "Admins can manage user_module_permissions" ON public.user_module_permissions;
CREATE POLICY "Admins can manage user_module_permissions" ON public.user_module_permissions AS PERMISSIVE FOR ALL TO public USING (is_admin(auth.uid()));
DROP POLICY IF EXISTS "Gestores can manage user_module_permissions" ON public.user_module_permissions;
CREATE POLICY "Gestores can manage user_module_permissions" ON public.user_module_permissions AS PERMISSIVE FOR ALL TO public USING (has_role(auth.uid(), 'gestor_produto'::app_role));
DROP POLICY IF EXISTS "Users can view own permissions" ON public.user_module_permissions;
CREATE POLICY "Users can view own permissions" ON public.user_module_permissions AS PERMISSIVE FOR SELECT TO public USING ((user_id = auth.uid()));
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
CREATE POLICY "Admins can manage roles" ON public.user_roles AS PERMISSIVE FOR ALL TO authenticated USING (is_admin(auth.uid()));
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
CREATE POLICY "Admins can view all roles" ON public.user_roles AS PERMISSIVE FOR SELECT TO authenticated USING (is_admin(auth.uid()));
DROP POLICY IF EXISTS "Marketing supervisors can view all user_roles" ON public.user_roles;
CREATE POLICY "Marketing supervisors can view all user_roles" ON public.user_roles AS PERMISSIVE FOR SELECT TO authenticated USING (is_marketing_supervisor(auth.uid()));
DROP POLICY IF EXISTS "Users can view their own role" ON public.user_roles;
CREATE POLICY "Users can view their own role" ON public.user_roles AS PERMISSIVE FOR SELECT TO authenticated USING ((user_id = auth.uid()));
DROP POLICY IF EXISTS "Admins can manage usuario_empreendimento_bonus" ON public.usuario_empreendimento_bonus;
CREATE POLICY "Admins can manage usuario_empreendimento_bonus" ON public.usuario_empreendimento_bonus AS PERMISSIVE FOR ALL TO public USING (is_admin(auth.uid()));
DROP POLICY IF EXISTS "Users can view own eligibility" ON public.usuario_empreendimento_bonus;
CREATE POLICY "Users can view own eligibility" ON public.usuario_empreendimento_bonus AS PERMISSIVE FOR SELECT TO public USING ((user_id = auth.uid()));
DROP POLICY IF EXISTS "Admins can view webhook logs" ON public.webhook_logs;
CREATE POLICY "Admins can view webhook logs" ON public.webhook_logs AS PERMISSIVE FOR SELECT TO authenticated USING (is_admin(auth.uid()));
DROP POLICY IF EXISTS "Service role can insert webhook logs" ON public.webhook_logs;
CREATE POLICY "Service role can insert webhook logs" ON public.webhook_logs AS PERMISSIVE FOR INSERT TO service_role WITH CHECK (true);
DROP POLICY IF EXISTS manage_webhook_vars_delete ON public.webhook_variaveis_disponiveis;
CREATE POLICY manage_webhook_vars_delete ON public.webhook_variaveis_disponiveis AS PERMISSIVE FOR DELETE TO authenticated USING (is_admin(auth.uid()));
DROP POLICY IF EXISTS manage_webhook_vars_insert ON public.webhook_variaveis_disponiveis;
CREATE POLICY manage_webhook_vars_insert ON public.webhook_variaveis_disponiveis AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (is_admin(auth.uid()));
DROP POLICY IF EXISTS manage_webhook_vars_update ON public.webhook_variaveis_disponiveis;
CREATE POLICY manage_webhook_vars_update ON public.webhook_variaveis_disponiveis AS PERMISSIVE FOR UPDATE TO authenticated USING (is_admin(auth.uid()));
DROP POLICY IF EXISTS read_webhook_vars ON public.webhook_variaveis_disponiveis;
CREATE POLICY read_webhook_vars ON public.webhook_variaveis_disponiveis AS PERMISSIVE FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Admins can manage webhooks" ON public.webhooks;
CREATE POLICY "Admins can manage webhooks" ON public.webhooks AS PERMISSIVE FOR ALL TO public USING (is_admin(auth.uid()));

-- 11) Grants ------------------------------------------------------------
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.atividade_comentarios TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.atividade_comentarios TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.atividade_comentarios TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.atividade_etapas TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.atividade_etapas TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.atividade_etapas TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.atividade_historico TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.atividade_historico TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.atividade_historico TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.atividade_responsaveis TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.atividade_responsaveis TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.atividade_responsaveis TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.atividades TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.atividades TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.atividades TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.audit_logs TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.audit_logs TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.audit_logs TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.blocos TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.blocos TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.blocos TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.bonificacoes TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.bonificacoes TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.bonificacoes TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.boxes TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.boxes TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.boxes TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.briefing_referencias TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.briefing_referencias TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.briefing_referencias TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.briefings TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.briefings TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.briefings TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.categorias_fluxo TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.categorias_fluxo TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.categorias_fluxo TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.centro_custo_empreendimentos TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.centro_custo_empreendimentos TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.centro_custo_empreendimentos TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.centros_custo TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.centros_custo TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.centros_custo TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.cliente_interacoes TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.cliente_interacoes TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.cliente_interacoes TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.cliente_socios TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.cliente_socios TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.cliente_socios TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.cliente_telefones TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.cliente_telefones TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.cliente_telefones TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.clientes TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.clientes TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.clientes TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.comissao_parcelas TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.comissao_parcelas TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.comissao_parcelas TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.comissoes TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.comissoes TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.comissoes TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.configuracao_comercial TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.configuracao_comercial TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.configuracao_comercial TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.configuracao_comissoes TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.configuracao_comissoes TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.configuracao_comissoes TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.configuracoes_sistema TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.configuracoes_sistema TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.configuracoes_sistema TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.contrato_aprovacoes TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.contrato_aprovacoes TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.contrato_aprovacoes TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.contrato_condicoes_pagamento TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.contrato_condicoes_pagamento TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.contrato_condicoes_pagamento TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.contrato_documentos TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.contrato_documentos TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.contrato_documentos TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.contrato_pendencias TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.contrato_pendencias TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.contrato_pendencias TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.contrato_signatarios TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.contrato_signatarios TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.contrato_signatarios TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.contrato_template_imagens TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.contrato_template_imagens TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.contrato_template_imagens TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.contrato_templates TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.contrato_templates TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.contrato_templates TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.contrato_unidades TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.contrato_unidades TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.contrato_unidades TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.contrato_variaveis TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.contrato_variaveis TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.contrato_variaveis TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.contrato_versoes TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.contrato_versoes TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.contrato_versoes TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.contratos TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.contratos TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.contratos TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.corretores TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.corretores TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.corretores TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.empreendimento_corretores TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.empreendimento_corretores TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.empreendimento_corretores TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.empreendimento_documentos TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.empreendimento_documentos TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.empreendimento_documentos TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.empreendimento_imobiliarias TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.empreendimento_imobiliarias TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.empreendimento_imobiliarias TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.empreendimento_midias TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.empreendimento_midias TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.empreendimento_midias TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.empreendimentos TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.empreendimentos TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.empreendimentos TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.evento_inscricoes TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.evento_inscricoes TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.evento_inscricoes TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.evento_membros TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.evento_membros TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.evento_membros TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.evento_tarefas TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.evento_tarefas TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.evento_tarefas TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.evento_template_tarefas TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.evento_template_tarefas TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.evento_template_tarefas TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.evento_templates TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.evento_templates TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.evento_templates TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.eventos TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.eventos TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.eventos TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.fachadas TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.fachadas TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.fachadas TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.fluxo_aprovacao_config TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.fluxo_aprovacao_config TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.fluxo_aprovacao_config TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.funil_etapas TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.funil_etapas TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.funil_etapas TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.funis TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.funis TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.funis TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.google_calendar_embeds TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.google_calendar_embeds TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.google_calendar_embeds TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.imobiliarias TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.imobiliarias TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.imobiliarias TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.incorporadoras TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.incorporadoras TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.incorporadoras TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.lancamentos_financeiros TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.lancamentos_financeiros TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.lancamentos_financeiros TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.mapa_empreendimento TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.mapa_empreendimento TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.mapa_empreendimento TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.metas_comerciais TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.metas_comerciais TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.metas_comerciais TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.modalidade_componentes TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.modalidade_componentes TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.modalidade_componentes TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.modalidades_pagamento TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.modalidades_pagamento TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.modalidades_pagamento TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.modules TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.modules TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.modules TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.negociacao_clientes TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.negociacao_clientes TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.negociacao_clientes TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.negociacao_comentarios TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.negociacao_comentarios TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.negociacao_comentarios TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.negociacao_condicoes_pagamento TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.negociacao_condicoes_pagamento TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.negociacao_condicoes_pagamento TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.negociacao_dacao_anexos TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.negociacao_dacao_anexos TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.negociacao_dacao_anexos TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.negociacao_historico TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.negociacao_historico TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.negociacao_historico TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.negociacao_unidades TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.negociacao_unidades TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.negociacao_unidades TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.negociacoes TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.negociacoes TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.negociacoes TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.notificacoes TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.notificacoes TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.notificacoes TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.planejamento_fases TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.planejamento_fases TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.planejamento_fases TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.planejamento_historico TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.planejamento_historico TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.planejamento_historico TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.planejamento_item_responsaveis TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.planejamento_item_responsaveis TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.planejamento_item_responsaveis TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.planejamento_itens TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.planejamento_itens TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.planejamento_itens TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.planejamento_status TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.planejamento_status TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.planejamento_status TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.plano_contas TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.plano_contas TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.plano_contas TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.profiles TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.profiles TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.profiles TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.projeto_comentarios TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.projeto_comentarios TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.projeto_comentarios TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.projeto_historico TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.projeto_historico TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.projeto_historico TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.projeto_responsaveis TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.projeto_responsaveis TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.projeto_responsaveis TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.projetos_marketing TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.projetos_marketing TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.projetos_marketing TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.proposta_condicoes_pagamento TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.proposta_condicoes_pagamento TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.proposta_condicoes_pagamento TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.proposta_unidades TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.proposta_unidades TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.proposta_unidades TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.propostas TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.propostas TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.propostas TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.reserva_documentos TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.reserva_documentos TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.reserva_documentos TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.role_permissions TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.role_permissions TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.role_permissions TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.roles TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.roles TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.roles TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.saldos_mensais TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.saldos_mensais TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.saldos_mensais TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.tarefas_projeto TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.tarefas_projeto TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.tarefas_projeto TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.template_condicoes_pagamento TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.template_condicoes_pagamento TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.template_condicoes_pagamento TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.termos_aceites TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.termos_aceites TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.termos_aceites TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.termos_versoes TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.termos_versoes TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.termos_versoes TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.ticket_criativos TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.ticket_criativos TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.ticket_criativos TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.ticket_etapas TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.ticket_etapas TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.ticket_etapas TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.tipologias TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.tipologias TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.tipologias TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.tipos_atendimento_config TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.tipos_atendimento_config TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.tipos_atendimento_config TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.tipos_parcela TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.tipos_parcela TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.tipos_parcela TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.unidade_historico_precos TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.unidade_historico_precos TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.unidade_historico_precos TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.unidades TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.unidades TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.unidades TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.user_empreendimentos TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.user_empreendimentos TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.user_empreendimentos TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.user_module_permissions TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.user_module_permissions TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.user_module_permissions TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.user_roles TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.user_roles TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.user_roles TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.usuario_empreendimento_bonus TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.usuario_empreendimento_bonus TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.usuario_empreendimento_bonus TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.webhook_logs TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.webhook_logs TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.webhook_logs TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.webhook_variaveis_disponiveis TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.webhook_variaveis_disponiveis TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.webhook_variaveis_disponiveis TO service_role;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.webhooks TO anon;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.webhooks TO authenticated;
GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON public.webhooks TO service_role;

-- 12) Storage buckets ---------------------------------------------------
INSERT INTO storage.buckets (id, name, public) VALUES ('empreendimentos-midias', 'empreendimentos-midias', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('empreendimentos-documentos', 'empreendimentos-documentos', false) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('contratos-documentos', 'contratos-documentos', false) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('projetos-arquivos', 'projetos-arquivos', false) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('briefing-referencias', 'briefing-referencias', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('negociacao-dacao', 'negociacao-dacao', true) ON CONFLICT (id) DO NOTHING;

-- =====================================================================
-- FIM DO DUMP
-- =====================================================================
