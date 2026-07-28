-- Define o conjunto canônico de tipos de atividade da Arqo usados na operação
-- e remove os tipos genéricos semeados inicialmente (Reunião/Outro), que não
-- fazem parte da lista oficial. Idempotente: pode rodar em qualquer ambiente
-- por cima da semeadura inicial de arqo_atividade_tipos.

INSERT INTO public.arqo_atividade_tipos (codigo, rotulo, ordem) VALUES
  ('ligacao', 'Ligação', 1),
  ('visita', 'Visita', 2),
  ('acao_vendas', 'Ação de vendas', 3),
  ('gravacao_conteudo', 'Gravação de conteúdo', 4),
  ('treinamento', 'Treinamento', 5),
  ('reuniao_interna', 'Reunião interna', 6)
ON CONFLICT (codigo) DO UPDATE
  SET rotulo = EXCLUDED.rotulo,
      ordem = EXCLUDED.ordem,
      is_active = true;

DELETE FROM public.arqo_atividade_tipos
WHERE codigo IN ('reuniao', 'outro');
