-- Adicionar coluna user_id na tabela corretores para vincular ao usuário de sistema
ALTER TABLE public.corretores 
ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Criar índice para busca eficiente
CREATE INDEX idx_corretores_user_id ON public.corretores(user_id);

-- Garantir que cada usuário só pode ter um corretor vinculado
ALTER TABLE public.corretores ADD CONSTRAINT unique_corretor_user_id UNIQUE (user_id);