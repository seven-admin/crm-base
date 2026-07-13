-- Garante que a exclusão administrativa de usuários consiga desvincular referências legadas.
-- Nenhuma tabela nova é criada nesta migration.

ALTER TABLE public.seven_cliente_interacoes
  ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE public.seven_unidade_historico_precos
  ALTER COLUMN alterado_por DROP NOT NULL;

ALTER TABLE public.sistema_audit_logs
  ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE public.nexa_contratos
  ALTER COLUMN created_by DROP NOT NULL;

ALTER TABLE public.nexa_contrato_templates
  ALTER COLUMN created_by DROP NOT NULL;

ALTER TABLE public.nexa_contrato_blocos
  ALTER COLUMN created_by DROP NOT NULL;