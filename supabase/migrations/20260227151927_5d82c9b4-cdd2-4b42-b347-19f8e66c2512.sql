
-- 1. Foreign key para permitir o join via PostgREST
ALTER TABLE public.negociacao_comentarios
  ADD CONSTRAINT fk_negociacao_comentarios_user_id
  FOREIGN KEY (user_id) REFERENCES public.profiles(id);

-- 2. RLS policy de SELECT para incorporadores lerem comentários das negociações dos seus empreendimentos
CREATE POLICY "Incorporador pode ler comentarios das negociacoes dos seus empreendimentos"
  ON public.negociacao_comentarios
  FOR SELECT
  TO authenticated
  USING (
    public.is_incorporador(auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.negociacoes n
      JOIN public.user_empreendimentos ue ON ue.empreendimento_id = n.empreendimento_id
      WHERE n.id = negociacao_comentarios.negociacao_id
        AND ue.user_id = auth.uid()
    )
  );

-- 3. RLS policy de INSERT para incorporadores adicionarem comentários
CREATE POLICY "Incorporador pode inserir comentarios nas negociacoes dos seus empreendimentos"
  ON public.negociacao_comentarios
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND public.is_incorporador(auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.negociacoes n
      JOIN public.user_empreendimentos ue ON ue.empreendimento_id = n.empreendimento_id
      WHERE n.id = negociacao_comentarios.negociacao_id
        AND ue.user_id = auth.uid()
    )
  );
