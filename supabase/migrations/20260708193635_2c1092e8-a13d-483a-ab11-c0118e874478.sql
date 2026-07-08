
INSERT INTO public.roles (name, display_name, description, is_active, is_system)
VALUES
  ('arqo_admin', 'Arqo Admin', 'Administrador do funil Arqo', true, true),
  ('arqo_gestor', 'Arqo Gestor', 'Gestor comercial Arqo', true, true),
  ('arqo_consultor', 'Arqo Consultor', 'Consultor de leads Arqo (roleta)', true, true),
  ('arqo_closer', 'Arqo Closer', 'Closer de fechamento Arqo', true, true)
ON CONFLICT (name) DO NOTHING;
