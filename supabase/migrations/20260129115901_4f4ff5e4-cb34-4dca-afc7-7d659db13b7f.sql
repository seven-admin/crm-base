-- Criar tabela para armazenar criativos dos tickets
CREATE TABLE public.ticket_criativos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  projeto_id UUID NOT NULL REFERENCES public.projetos_marketing(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL DEFAULT 'imagem',
  nome TEXT,
  url TEXT NOT NULL,
  is_final BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índice para busca rápida
CREATE INDEX idx_ticket_criativos_projeto ON public.ticket_criativos(projeto_id);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_ticket_criativos_updated_at
  BEFORE UPDATE ON public.ticket_criativos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.ticket_criativos ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso para a tabela
CREATE POLICY "Admins podem tudo em criativos"
  ON public.ticket_criativos FOR ALL
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Marketing supervisors podem gerenciar criativos"
  ON public.ticket_criativos FOR ALL
  USING (public.is_marketing_supervisor(auth.uid()));

CREATE POLICY "Usuários autenticados podem visualizar criativos"
  ON public.ticket_criativos FOR SELECT
  TO authenticated
  USING (true);

-- Políticas de storage para o bucket projetos-arquivos
CREATE POLICY "Marketing team can upload to projetos-arquivos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'projetos-arquivos' 
    AND (public.is_admin(auth.uid()) OR public.is_marketing_supervisor(auth.uid()))
  );

CREATE POLICY "Authenticated users can view projetos-arquivos"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'projetos-arquivos');

CREATE POLICY "Marketing team can delete from projetos-arquivos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'projetos-arquivos' 
    AND (public.is_admin(auth.uid()) OR public.is_marketing_supervisor(auth.uid()))
  );