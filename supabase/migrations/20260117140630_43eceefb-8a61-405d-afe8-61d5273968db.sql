-- Adicionar coluna conjuge_id na tabela clientes
ALTER TABLE public.clientes ADD COLUMN conjuge_id UUID REFERENCES public.clientes(id);

-- Criar tabela de relacionamento cliente_socios
CREATE TABLE public.cliente_socios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  socio_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  percentual_participacao NUMERIC(5,2),
  observacao TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(cliente_id, socio_id),
  CHECK (cliente_id != socio_id)
);

-- Habilitar RLS para cliente_socios
ALTER TABLE public.cliente_socios ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para cliente_socios
CREATE POLICY "Usuarios logados podem ver socios"
  ON public.cliente_socios FOR SELECT TO public
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Usuarios logados podem inserir socios"
  ON public.cliente_socios FOR INSERT TO public
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Usuarios logados podem atualizar socios"
  ON public.cliente_socios FOR UPDATE TO public
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Usuarios logados podem remover socios"
  ON public.cliente_socios FOR DELETE TO public
  USING (auth.uid() IS NOT NULL);

-- Índices para performance
CREATE INDEX idx_cliente_socios_cliente_id ON public.cliente_socios(cliente_id);
CREATE INDEX idx_cliente_socios_socio_id ON public.cliente_socios(socio_id);
CREATE INDEX idx_clientes_conjuge_id ON public.clientes(conjuge_id);