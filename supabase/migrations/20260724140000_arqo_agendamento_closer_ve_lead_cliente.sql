-- Permite que o closer/responsável de um agendamento leia o lead e o cliente vinculados.
-- Antes: o closer do agendamento via a linha do agendamento (arqo_agendamentos_select),
-- mas não conseguia ler o lead/cliente embutidos (arqo_leads_select e a policy de seven_clientes
-- exigiam ser consultor/closer do próprio lead), fazendo Cliente/Empreendimento aparecerem como "—".
-- Funções SECURITY DEFINER evitam recursão entre as policies de arqo_leads e arqo_agendamentos.

create or replace function public.arqo_pode_ver_lead_por_agendamento(p_lead_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from arqo_agendamentos ag
    where ag.lead_id = p_lead_id
      and (ag.closer_id = auth.uid() or ag.responsavel_id = auth.uid())
  );
$$;

create or replace function public.arqo_pode_ver_cliente_por_agendamento(p_cliente_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from arqo_agendamentos ag
    join arqo_leads l on l.id = ag.lead_id
    where l.cliente_id = p_cliente_id
      and (ag.closer_id = auth.uid() or ag.responsavel_id = auth.uid())
  );
$$;

alter policy "arqo_leads_select" on public.arqo_leads
using (
  is_admin((select auth.uid()))
  or has_role((select auth.uid()), 'arqo_admin')
  or has_role((select auth.uid()), 'arqo_gestor')
  or (consultor_id = (select auth.uid()))
  or (reserva_consultor_id = (select auth.uid()))
  or (closer_id = (select auth.uid()))
  or public.arqo_pode_ver_lead_por_agendamento(id)
);

alter policy "Arqo can view lead clientes" on public.seven_clientes
using (
  exists (
    select 1
    from arqo_leads l
    where l.cliente_id = seven_clientes.id
      and l.is_active = true
      and (
        is_admin(auth.uid())
        or has_role(auth.uid(), 'arqo_admin')
        or has_role(auth.uid(), 'arqo_gestor')
        or l.consultor_id = auth.uid()
        or l.closer_id = auth.uid()
      )
  )
  or public.arqo_pode_ver_cliente_por_agendamento(seven_clientes.id)
);
