-- Atualizar função para incluir equipe Seven no acesso a empreendimentos
CREATE OR REPLACE FUNCTION public.user_has_empreendimento_access(_user_id uuid, _empreendimento_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT 
    public.is_admin(_user_id) 
    OR public.has_role(_user_id, 'gestor_produto')
    OR public.has_role(_user_id, 'corretor')
    -- Equipe Seven tem acesso de visualização a todos os empreendimentos
    OR public.is_seven_team(_user_id)
    OR EXISTS (
      SELECT 1 FROM public.user_empreendimentos
      WHERE user_id = _user_id 
        AND empreendimento_id = _empreendimento_id
    )
$function$;