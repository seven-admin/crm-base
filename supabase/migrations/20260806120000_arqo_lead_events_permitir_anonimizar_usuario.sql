-- arqo_lead_events é imutável, mas o FK usuario_id é ON DELETE SET NULL. Ao excluir um
-- usuário, o cascade tenta anular usuario_id e o trigger de imutabilidade bloqueava esse
-- UPDATE, impedindo a exclusão de qualquer usuário com histórico de leads.
-- Aqui liberamos APENAS a anonimização (usuario_id -> NULL sem outra alteração); qualquer
-- outro UPDATE e todo DELETE continuam bloqueados.
CREATE OR REPLACE FUNCTION public.arqo_lead_events_readonly()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.usuario_id IS NOT NULL AND NEW.usuario_id IS NULL THEN
    NEW.usuario_id := OLD.usuario_id;            -- iguala para comparar o restante da linha
    IF NEW IS NOT DISTINCT FROM OLD THEN
      NEW.usuario_id := NULL;                    -- só usuario_id mudou: libera a anonimização
      RETURN NEW;
    END IF;
    NEW.usuario_id := NULL;                      -- restaura o valor pretendido (rejeitado abaixo)
  END IF;
  RAISE EXCEPTION 'Eventos de lead são imutáveis';
END;
$function$;
