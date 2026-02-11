-- Adicionar coluna passaporte para clientes estrangeiros
ALTER TABLE public.clientes 
ADD COLUMN IF NOT EXISTS passaporte TEXT;

COMMENT ON COLUMN public.clientes.passaporte IS 'Número do passaporte para clientes estrangeiros';

-- Notificar PostgREST para recarregar schema
NOTIFY pgrst, 'reload schema';