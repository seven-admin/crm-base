-- Inserir módulo incorporadoras para permissões (com colunas corretas)
INSERT INTO public.modules (name, display_name, description, is_active, category)
VALUES ('incorporadoras', 'Incorporadoras', 'Gerenciamento de incorporadoras', true, 'Parceiros')
ON CONFLICT (name) DO NOTHING;