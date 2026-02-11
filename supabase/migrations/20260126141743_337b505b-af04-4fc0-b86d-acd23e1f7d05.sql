-- Tornar coluna role nullable para permitir uso exclusivo de role_id
ALTER TABLE user_roles ALTER COLUMN role DROP NOT NULL;