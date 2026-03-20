CREATE OR REPLACE FUNCTION public.user_has_empreendimento_access(_user_id uuid, _empreendimento_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT 
    public.is_admin(_user_id) 
    OR public.has_role(_user_id, 'gestor_produto')
    OR public.is_seven_team(_user_id)
    -- Corretor e gestor_imobiliaria veem todos os empreendimentos ativos
    OR public.has_role(_user_id, 'corretor')
    OR public.is_gestor_imobiliaria(_user_id)
    -- Vínculo individual (user_empreendimentos)
    OR EXISTS (
      SELECT 1 FROM public.user_empreendimentos
      WHERE user_id = _user_id 
        AND empreendimento_id = _empreendimento_id
    )
    -- Acesso herdado via imobiliária
    OR EXISTS (
      SELECT 1 
      FROM public.corretores c
      JOIN public.empreendimento_imobiliarias ei ON ei.imobiliaria_id = c.imobiliaria_id
      WHERE c.user_id = _user_id 
        AND ei.empreendimento_id = _empreendimento_id
    )
    OR EXISTS (
      SELECT 1 
      FROM public.imobiliarias i
      JOIN public.empreendimento_imobiliarias ei ON ei.imobiliaria_id = i.id
      WHERE i.user_id = _user_id 
        AND ei.empreendimento_id = _empreendimento_id
    )
$function$;