create table public.nexa_whatsapp_atividades (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  whatsapp text not null,
  data date not null default current_date,
  historico text,
  categoria text,
  proximas_atividades text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.nexa_whatsapp_atividades is
  'Resumos diários de conversas de WhatsApp gerados por automação n8n: lê as conversas do dia, resume, classifica por categoria e registra próximas atividades.';

create index nexa_whatsapp_atividades_data_idx on public.nexa_whatsapp_atividades (data desc);
create index nexa_whatsapp_atividades_whatsapp_idx on public.nexa_whatsapp_atividades (whatsapp);
create index nexa_whatsapp_atividades_categoria_idx on public.nexa_whatsapp_atividades (categoria);

create trigger set_updated_at
  before update on public.nexa_whatsapp_atividades
  for each row execute function public.update_updated_at_column();

alter table public.nexa_whatsapp_atividades enable row level security;

create policy "Nexa users view whatsapp atividades"
  on public.nexa_whatsapp_atividades for select
  using (is_admin(auth.uid()) or is_nexa_user(auth.uid()));

create policy "Nexa users insert whatsapp atividades"
  on public.nexa_whatsapp_atividades for insert
  with check (is_admin(auth.uid()) or is_nexa_user(auth.uid()));

create policy "Nexa users update whatsapp atividades"
  on public.nexa_whatsapp_atividades for update
  using (is_admin(auth.uid()) or is_nexa_user(auth.uid()))
  with check (is_admin(auth.uid()) or is_nexa_user(auth.uid()));

create policy "Admins delete whatsapp atividades"
  on public.nexa_whatsapp_atividades for delete
  using (is_admin(auth.uid()));
