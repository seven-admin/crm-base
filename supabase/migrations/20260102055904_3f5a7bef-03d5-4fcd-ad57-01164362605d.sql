-- Adicionar coluna para configurar quais status aparecem na legenda do mapa
ALTER TABLE public.empreendimentos 
ADD COLUMN IF NOT EXISTS legenda_status_visiveis text[] DEFAULT ARRAY['disponivel', 'reservada', 'vendida', 'bloqueada'];

-- Adicionar evento de assinatura aos webhooks disponíveis
-- (já existe contrato_assinado, vamos adicionar envio de assinatura)
-- Não precisa de alteração no banco, apenas adicionar no WEBHOOK_EVENTS no código