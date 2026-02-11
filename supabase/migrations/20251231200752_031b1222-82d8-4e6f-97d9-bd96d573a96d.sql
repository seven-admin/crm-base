-- Inserir novas configurações para a tela de login
INSERT INTO configuracoes_sistema (chave, valor, categoria)
VALUES 
  ('login_subtitulo', 'CRM Imobiliário', 'login'),
  ('login_descricao', 'Plataforma completa para gestão de empreendimentos imobiliários', 'login')
ON CONFLICT (chave) DO NOTHING;