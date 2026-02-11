-- Criar enum para status de briefing (se não existir)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'briefing_status') THEN
    CREATE TYPE public.briefing_status AS ENUM (
      'pendente',
      'triado',
      'em_producao',
      'revisao',
      'aprovado',
      'entregue',
      'cancelado'
    );
  END IF;
END $$;

-- Criar sequence para código do briefing
CREATE SEQUENCE IF NOT EXISTS public.briefing_codigo_seq START 1;

-- Criar tabela de briefings
CREATE TABLE IF NOT EXISTS public.briefings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT NOT NULL UNIQUE,
  
  -- Dados do briefing
  cliente TEXT NOT NULL,
  tema TEXT NOT NULL,
  objetivo TEXT,
  head_titulo TEXT,
  sub_complemento TEXT,
  mensagem_chave TEXT,
  formato_peca TEXT,
  tom_comunicacao TEXT,
  
  -- Sugestão de Layout
  estilo_visual TEXT,
  composicao TEXT,
  importante TEXT,
  diretrizes_visuais TEXT,
  referencia TEXT,
  observacoes TEXT,
  
  -- Relacionamentos
  empreendimento_id UUID REFERENCES public.empreendimentos(id),
  criado_por UUID REFERENCES auth.users(id) NOT NULL,
  triado_por UUID REFERENCES auth.users(id),
  
  -- Status e datas
  status public.briefing_status NOT NULL DEFAULT 'pendente',
  data_triagem TIMESTAMPTZ,
  data_entrega TIMESTAMPTZ,
  
  -- Metadados
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger para gerar código automaticamente
CREATE OR REPLACE FUNCTION public.generate_briefing_codigo()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  NEW.codigo := 'BRF-' || LPAD(nextval('briefing_codigo_seq')::TEXT, 5, '0');
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS set_briefing_codigo ON public.briefings;
CREATE TRIGGER set_briefing_codigo
BEFORE INSERT ON public.briefings
FOR EACH ROW
WHEN (NEW.codigo IS NULL OR NEW.codigo = '')
EXECUTE FUNCTION public.generate_briefing_codigo();

-- Habilitar RLS
ALTER TABLE public.briefings ENABLE ROW LEVEL SECURITY;

-- Função para verificar se o usuário é da equipe Seven
CREATE OR REPLACE FUNCTION public.is_seven_team(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = _user_id
      AND ur.role NOT IN ('incorporador', 'corretor', 'cliente_externo')
  )
$$;

-- Políticas RLS
CREATE POLICY "Seven team can view all briefings"
ON public.briefings
FOR SELECT
USING (is_seven_team(auth.uid()) OR is_admin(auth.uid()));

CREATE POLICY "Incorporadores can view own briefings"
ON public.briefings
FOR SELECT
USING (criado_por = auth.uid());

CREATE POLICY "Users can create briefings"
ON public.briefings
FOR INSERT
WITH CHECK (auth.uid() = criado_por);

CREATE POLICY "Incorporadores can update own pending briefings"
ON public.briefings
FOR UPDATE
USING (criado_por = auth.uid() AND status = 'pendente');

CREATE POLICY "Seven team can update all briefings"
ON public.briefings
FOR UPDATE
USING (is_seven_team(auth.uid()) OR is_admin(auth.uid()));

CREATE POLICY "Admins can delete briefings"
ON public.briefings
FOR DELETE
USING (is_admin(auth.uid()));

-- Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS update_briefings_updated_at ON public.briefings;
CREATE TRIGGER update_briefings_updated_at
BEFORE UPDATE ON public.briefings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_briefings_criado_por ON public.briefings(criado_por);
CREATE INDEX IF NOT EXISTS idx_briefings_status ON public.briefings(status);
CREATE INDEX IF NOT EXISTS idx_briefings_empreendimento ON public.briefings(empreendimento_id);
CREATE INDEX IF NOT EXISTS idx_briefings_created_at ON public.briefings(created_at DESC);