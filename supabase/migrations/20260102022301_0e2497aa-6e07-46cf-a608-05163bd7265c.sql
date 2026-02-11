-- =====================================================
-- FASE 1: Migração do Banco de Dados - Unificar Lead e Cliente (CORRIGIDO)
-- =====================================================

-- 1.1 Adicionar novos campos na tabela clientes para ciclo de vida
ALTER TABLE public.clientes 
ADD COLUMN IF NOT EXISTS fase TEXT DEFAULT 'prospecto',
ADD COLUMN IF NOT EXISTS temperatura TEXT DEFAULT 'frio',
ADD COLUMN IF NOT EXISTS imobiliaria_id UUID REFERENCES public.imobiliarias(id),
ADD COLUMN IF NOT EXISTS data_qualificacao TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS data_primeira_negociacao TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS data_primeira_compra TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS motivo_perda TEXT,
ADD COLUMN IF NOT EXISTS data_perda TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS estado_civil TEXT,
ADD COLUMN IF NOT EXISTS nacionalidade TEXT,
ADD COLUMN IF NOT EXISTS nome_mae TEXT,
ADD COLUMN IF NOT EXISTS nome_pai TEXT;

-- 1.2 Criar tabela de interações do cliente (substituindo lead_interactions)
CREATE TABLE IF NOT EXISTS public.cliente_interacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  tipo TEXT NOT NULL,
  descricao TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS na nova tabela
ALTER TABLE public.cliente_interacoes ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para cliente_interacoes
CREATE POLICY "Admins can manage cliente_interacoes"
ON public.cliente_interacoes FOR ALL
USING (is_admin(auth.uid()));

CREATE POLICY "Gestores can manage cliente_interacoes"
ON public.cliente_interacoes FOR ALL
USING (has_role(auth.uid(), 'gestor_produto'::app_role));

CREATE POLICY "Users can view cliente_interacoes"
ON public.cliente_interacoes FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM clientes c
    WHERE c.id = cliente_interacoes.cliente_id
    AND (
      is_admin(auth.uid()) OR 
      has_role(auth.uid(), 'gestor_produto'::app_role) OR
      c.corretor_id IN (
        SELECT cor.id FROM corretores cor
        JOIN profiles p ON p.email = cor.email
        WHERE p.id = auth.uid()
      )
    )
  )
);

CREATE POLICY "Users can insert cliente_interacoes"
ON public.cliente_interacoes FOR INSERT
WITH CHECK (true);

-- 1.3 Migrar dados de leads para clientes (leads não convertidos)
INSERT INTO public.clientes (
  nome,
  email,
  telefone,
  whatsapp,
  cpf,
  rg,
  data_nascimento,
  corretor_id,
  origem,
  observacoes,
  endereco_cep,
  endereco_logradouro,
  endereco_numero,
  endereco_complemento,
  endereco_bairro,
  endereco_cidade,
  endereco_uf,
  profissao,
  estado_civil,
  nacionalidade,
  nome_mae,
  nome_pai,
  fase,
  temperatura,
  imobiliaria_id,
  motivo_perda,
  data_perda,
  is_active,
  created_at,
  lead_id
)
SELECT 
  l.nome,
  l.email,
  l.telefone,
  l.whatsapp,
  l.cpf,
  l.rg,
  l.data_nascimento,
  l.corretor_id,
  l.origem,
  l.observacoes,
  l.endereco_cep,
  l.endereco_logradouro,
  l.endereco_numero,
  l.endereco_complemento,
  l.endereco_bairro,
  l.endereco_cidade,
  l.endereco_uf,
  l.profissao,
  l.estado_civil,
  l.nacionalidade,
  l.nome_mae,
  l.nome_pai,
  CASE 
    WHEN l.status = 'perdido' THEN 'perdido'
    ELSE 'prospecto'
  END,
  l.temperatura::text,
  l.imobiliaria_id,
  NULL, -- motivo_perda - leads não tem esse campo
  CASE WHEN l.status = 'perdido' THEN l.updated_at ELSE NULL END,
  l.is_active,
  l.created_at,
  l.id
FROM public.leads l
WHERE l.status != 'convertido'
AND NOT EXISTS (
  SELECT 1 FROM public.clientes c WHERE c.lead_id = l.id
);

-- 1.4 Migrar interações de leads para clientes
INSERT INTO public.cliente_interacoes (cliente_id, user_id, tipo, descricao, created_at)
SELECT 
  c.id as cliente_id,
  li.user_id,
  li.tipo,
  li.descricao,
  li.created_at
FROM public.lead_interactions li
JOIN public.clientes c ON c.lead_id = li.lead_id;

-- 1.5 Atualizar clientes que já vieram de leads convertidos com fase correta
UPDATE public.clientes c
SET 
  fase = CASE 
    WHEN EXISTS (SELECT 1 FROM public.contratos ct WHERE ct.cliente_id = c.id AND ct.status = 'assinado') THEN 'comprador'
    WHEN EXISTS (SELECT 1 FROM public.negociacoes n WHERE n.cliente_id = c.id) THEN 'negociando'
    ELSE 'qualificado'
  END,
  temperatura = COALESCE(l.temperatura::text, c.temperatura, 'morno'),
  imobiliaria_id = COALESCE(c.imobiliaria_id, l.imobiliaria_id),
  data_qualificacao = COALESCE(c.data_qualificacao, l.convertido_em)
FROM public.leads l
WHERE c.lead_id = l.id
AND l.status = 'convertido';

-- 1.6 Adicionar índices para performance
CREATE INDEX IF NOT EXISTS idx_clientes_fase ON public.clientes(fase);
CREATE INDEX IF NOT EXISTS idx_clientes_temperatura ON public.clientes(temperatura);
CREATE INDEX IF NOT EXISTS idx_clientes_imobiliaria ON public.clientes(imobiliaria_id);
CREATE INDEX IF NOT EXISTS idx_cliente_interacoes_cliente ON public.cliente_interacoes(cliente_id);