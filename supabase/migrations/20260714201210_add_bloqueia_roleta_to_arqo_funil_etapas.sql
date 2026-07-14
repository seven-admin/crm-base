alter table public.arqo_funil_etapas
  add column bloqueia_roleta boolean not null default true;

comment on column public.arqo_funil_etapas.bloqueia_roleta is
  'Quando falso, um lead nesta etapa não conta como "lead ativo" do consultor na roleta: ele continua vinculado, mas o consultor pode puxar um novo lead mesmo com este em aberto (ex: Aguardando Followup, Reagendar).';

update public.arqo_funil_etapas
  set bloqueia_roleta = false
  where nome in ('Aguardando Followup', 'Reagendar');
