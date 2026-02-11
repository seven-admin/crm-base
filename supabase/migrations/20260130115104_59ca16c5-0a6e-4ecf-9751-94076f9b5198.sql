-- =============================================
-- MÓDULO DE PLANEJAMENTO - FASE 1: MODELO DE DADOS
-- =============================================

-- 1. Tabela de Fases do Planejamento
CREATE TABLE public.planejamento_fases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  cor TEXT DEFAULT '#3B82F6',
  ordem INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Tabela de Status do Planejamento
CREATE TABLE public.planejamento_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  cor TEXT DEFAULT '#6B7280',
  ordem INTEGER DEFAULT 0,
  is_final BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Tabela de Itens do Planejamento
CREATE TABLE public.planejamento_itens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empreendimento_id UUID NOT NULL REFERENCES public.empreendimentos(id) ON DELETE CASCADE,
  fase_id UUID NOT NULL REFERENCES public.planejamento_fases(id),
  status_id UUID NOT NULL REFERENCES public.planejamento_status(id),
  item TEXT NOT NULL,
  responsavel_tecnico_id UUID REFERENCES public.profiles(id),
  data_inicio DATE,
  data_fim DATE,
  obs TEXT,
  ordem INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT check_datas CHECK (data_fim IS NULL OR data_inicio IS NULL OR data_fim >= data_inicio)
);

-- 4. Tabela de Histórico (Auditoria)
CREATE TABLE public.planejamento_historico (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES public.planejamento_itens(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id),
  campo_alterado TEXT NOT NULL,
  valor_anterior TEXT,
  valor_novo TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- ÍNDICES PARA PERFORMANCE
-- =============================================
CREATE INDEX idx_planejamento_itens_empreendimento ON public.planejamento_itens(empreendimento_id);
CREATE INDEX idx_planejamento_itens_fase ON public.planejamento_itens(fase_id);
CREATE INDEX idx_planejamento_itens_status ON public.planejamento_itens(status_id);
CREATE INDEX idx_planejamento_itens_responsavel ON public.planejamento_itens(responsavel_tecnico_id);
CREATE INDEX idx_planejamento_itens_datas ON public.planejamento_itens(data_inicio, data_fim);
CREATE INDEX idx_planejamento_historico_item ON public.planejamento_historico(item_id);

-- =============================================
-- DADOS INICIAIS
-- =============================================

-- Fases iniciais
INSERT INTO public.planejamento_fases (nome, cor, ordem) VALUES
  ('Fase 01 - Atendimento', '#22C55E', 1),
  ('Fase 02 - Planejamento', '#3B82F6', 2),
  ('Fase 03 - Produção', '#F59E0B', 3),
  ('Fase 04 - Lançamento', '#8B5CF6', 4),
  ('Fase 05 - Suporte', '#6B7280', 5);

-- Status iniciais
INSERT INTO public.planejamento_status (nome, cor, ordem, is_final) VALUES
  ('Em Desenvolvimento', '#3B82F6', 1, false),
  ('Aguarda Apresentação', '#F59E0B', 2, false),
  ('Finalizado', '#22C55E', 3, true);

-- =============================================
-- TRIGGER DE AUDITORIA
-- =============================================
CREATE OR REPLACE FUNCTION public.log_planejamento_changes()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER planejamento_audit_trigger
  BEFORE UPDATE ON public.planejamento_itens
  FOR EACH ROW
  EXECUTE FUNCTION public.log_planejamento_changes();

-- Trigger para updated_at nas fases
CREATE TRIGGER update_planejamento_fases_updated_at
  BEFORE UPDATE ON public.planejamento_fases
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para updated_at nos status
CREATE TRIGGER update_planejamento_status_updated_at
  BEFORE UPDATE ON public.planejamento_status
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

-- Habilitar RLS
ALTER TABLE public.planejamento_fases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planejamento_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planejamento_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planejamento_historico ENABLE ROW LEVEL SECURITY;

-- Fases: leitura pública, escrita apenas Seven team
CREATE POLICY "planejamento_fases_select" ON public.planejamento_fases 
  FOR SELECT USING (true);

CREATE POLICY "planejamento_fases_all" ON public.planejamento_fases 
  FOR ALL USING (public.is_seven_team(auth.uid()));

-- Status: leitura pública, escrita apenas Seven team
CREATE POLICY "planejamento_status_select" ON public.planejamento_status 
  FOR SELECT USING (true);

CREATE POLICY "planejamento_status_all" ON public.planejamento_status 
  FOR ALL USING (public.is_seven_team(auth.uid()));

-- Itens: Seven vê/edita tudo, Incorporador vê apenas seus empreendimentos
CREATE POLICY "planejamento_itens_seven" ON public.planejamento_itens 
  FOR ALL USING (public.is_seven_team(auth.uid()));

CREATE POLICY "planejamento_itens_incorporador_select" ON public.planejamento_itens 
  FOR SELECT USING (
    public.is_incorporador(auth.uid()) AND 
    empreendimento_id IN (
      SELECT empreendimento_id FROM public.user_empreendimentos WHERE user_id = auth.uid()
    )
  );

-- Histórico: mesmas regras dos itens
CREATE POLICY "planejamento_historico_seven" ON public.planejamento_historico 
  FOR ALL USING (public.is_seven_team(auth.uid()));

CREATE POLICY "planejamento_historico_incorporador_select" ON public.planejamento_historico 
  FOR SELECT USING (
    item_id IN (
      SELECT id FROM public.planejamento_itens 
      WHERE empreendimento_id IN (
        SELECT empreendimento_id FROM public.user_empreendimentos WHERE user_id = auth.uid()
      )
    )
  );