-- Força o PostgREST a recarregar o schema cache para reconhecer a FK clientes_conjuge_id_fkey
NOTIFY pgrst, 'reload schema';