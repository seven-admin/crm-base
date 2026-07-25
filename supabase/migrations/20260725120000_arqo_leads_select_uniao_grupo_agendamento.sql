-- Reconcilia a policy arqo_leads_select unindo as duas intenções que ficaram
-- separadas após a fusão das branches:
--   - acesso por MEMBRO DE GRUPO (migration do Codex 20260721210521), e
--   - acesso por AGENDAMENTO (migration 20260724140000).
-- A migration mais recente vencia num replay e deixava só uma das cláusulas;
-- aqui garantimos a união, alinhando produção e histórico.

alter policy "arqo_leads_select" on public.arqo_leads using (
  is_admin((select auth.uid()))
  or has_role((select auth.uid()), 'arqo_admin')
  or has_role((select auth.uid()), 'arqo_gestor')
  or consultor_id = (select auth.uid())
  or reserva_consultor_id = (select auth.uid())
  or closer_id = (select auth.uid())
  or (
    grupo_id is not null
    and exists (
      select 1 from public.arqo_grupo_membros m
      where m.grupo_id = arqo_leads.grupo_id
        and m.user_id = (select auth.uid())
        and m.is_active = true
    )
  )
  or public.arqo_pode_ver_lead_por_agendamento(id)
);
