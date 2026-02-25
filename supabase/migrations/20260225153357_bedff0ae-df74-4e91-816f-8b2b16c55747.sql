
-- Tabela de histórico de atividades
CREATE TABLE public.atividade_historico (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  atividade_id uuid NOT NULL REFERENCES public.atividades(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles(id),
  tipo_evento text NOT NULL,
  campo_alterado text,
  valor_anterior text,
  valor_novo text,
  observacao text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX idx_atividade_historico_atividade ON public.atividade_historico(atividade_id);
CREATE INDEX idx_atividade_historico_created ON public.atividade_historico(created_at DESC);

-- RLS
ALTER TABLE public.atividade_historico ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read historico"
  ON public.atividade_historico
  FOR SELECT
  TO authenticated
  USING (true);

-- Trigger function para INSERT (criação)
CREATE OR REPLACE FUNCTION public.log_atividade_criacao()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.atividade_historico (atividade_id, user_id, tipo_evento, valor_novo)
  VALUES (NEW.id, auth.uid(), 'criacao', NEW.titulo);
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_atividade_insert_historico
  AFTER INSERT ON public.atividades
  FOR EACH ROW
  EXECUTE FUNCTION public.log_atividade_criacao();

-- Trigger function para UPDATE (alterações)
CREATE OR REPLACE FUNCTION public.log_atividade_alteracao()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
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
$$;

CREATE TRIGGER trg_atividade_update_historico
  AFTER UPDATE ON public.atividades
  FOR EACH ROW
  EXECUTE FUNCTION public.log_atividade_alteracao();
