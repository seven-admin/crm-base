-- Participantes das atividades NEXA passam a vir dos corretores do banco da NEXA
-- (app_user_profiles, externo). Como não há FK cross-database, o corretor_id deixa
-- de referenciar seven_corretores e guardamos um snapshot de nome/imobiliária.
ALTER TABLE public.nexa_atividade_participantes
  DROP CONSTRAINT IF EXISTS nexa_atividade_participantes_corretor_id_fkey;

ALTER TABLE public.nexa_atividade_participantes
  ADD COLUMN IF NOT EXISTS corretor_nome text,
  ADD COLUMN IF NOT EXISTS imobiliaria_nome text;
