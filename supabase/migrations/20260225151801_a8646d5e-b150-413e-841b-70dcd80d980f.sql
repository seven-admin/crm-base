
INSERT INTO public.configuracoes_sistema (chave, valor, categoria) VALUES
  ('sidebar_cor_planejamento', '#10B981', 'sidebar'),
  ('sidebar_cor_empreendimentos', '#10B981', 'sidebar'),
  ('sidebar_cor_clientes', '#8B5CF6', 'sidebar'),
  ('sidebar_cor_comercial', '#F5941E', 'sidebar'),
  ('sidebar_cor_diario_de_bordo', '#F5941E', 'sidebar'),
  ('sidebar_cor_contratos', '#60A5FA', 'sidebar'),
  ('sidebar_cor_financeiro', '#F59E0B', 'sidebar'),
  ('sidebar_cor_parceiros', '#EC4899', 'sidebar'),
  ('sidebar_cor_marketing', '#EC4899', 'sidebar'),
  ('sidebar_cor_eventos', '#06B6D4', 'sidebar'),
  ('sidebar_cor_sistema', '#94A3B8', 'sidebar')
ON CONFLICT (chave) DO NOTHING;
