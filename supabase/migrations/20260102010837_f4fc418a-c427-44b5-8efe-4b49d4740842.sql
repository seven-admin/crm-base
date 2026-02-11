-- Adicionar colunas para etapas dinâmicas no histórico de negociação
ALTER TABLE public.negociacao_historico 
ADD COLUMN IF NOT EXISTS funil_etapa_anterior_id UUID REFERENCES public.funil_etapas(id),
ADD COLUMN IF NOT EXISTS funil_etapa_nova_id UUID REFERENCES public.funil_etapas(id);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_negociacao_historico_etapa_anterior 
ON public.negociacao_historico(funil_etapa_anterior_id);

CREATE INDEX IF NOT EXISTS idx_negociacao_historico_etapa_nova 
ON public.negociacao_historico(funil_etapa_nova_id);

-- Tornar etapa_nova nullable pois agora usamos funil_etapa_nova_id
ALTER TABLE public.negociacao_historico 
ALTER COLUMN etapa_nova DROP NOT NULL;