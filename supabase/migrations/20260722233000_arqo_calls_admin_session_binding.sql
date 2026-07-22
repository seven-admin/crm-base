-- O administrador vincula uma sessão AstraCalls já existente a cada usuário Arqo.

ALTER TABLE public.arqo_call_sessions
  ADD COLUMN chatwoot_webhook_url text;

COMMENT ON COLUMN public.arqo_call_sessions.chatwoot_webhook_url IS
  'Webhook Chatwoot da sessão AstraCalls; o external_session_id é extraído desta URL pelo gateway.';
