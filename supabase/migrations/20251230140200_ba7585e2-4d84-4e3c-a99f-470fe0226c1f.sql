-- ===========================================
-- ETAPA 0: RBAC e AUDITORIA - FUNDAÇÃO DO SISTEMA
-- ===========================================

-- 1. ENUM DE PERFIS
create type public.app_role as enum (
  'admin',           -- Acesso total ao sistema
  'gestor_produto',  -- Acesso por empreendimento vinculado
  'incorporador',    -- Somente leitura por empreendimento
  'corretor'         -- Usuário externo, acesso próprio
);

-- 2. TABELA DE PERFIS (PROFILES)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null,
  phone text,
  avatar_url text,
  is_active boolean default true not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.profiles enable row level security;

-- 3. TABELA DE ROLES (SEPARADA PARA SEGURANÇA)
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  created_at timestamptz default now() not null,
  unique(user_id, role)
);

alter table public.user_roles enable row level security;

-- 4. TABELA DE MÓDULOS DO SISTEMA
create table public.modules (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  display_name text not null,
  description text,
  icon text,
  route text,
  is_active boolean default true not null,
  created_at timestamptz default now() not null
);

alter table public.modules enable row level security;

-- 5. TABELA DE PERMISSÕES POR PERFIL
create table public.role_permissions (
  id uuid primary key default gen_random_uuid(),
  role app_role not null,
  module_id uuid references public.modules(id) on delete cascade not null,
  can_view boolean default false not null,
  can_create boolean default false not null,
  can_edit boolean default false not null,
  can_delete boolean default false not null,
  scope text check (scope in ('global', 'empreendimento', 'proprio')) default 'proprio' not null,
  created_at timestamptz default now() not null,
  unique(role, module_id)
);

alter table public.role_permissions enable row level security;

-- 6. TABELA DE VÍNCULO USUÁRIO-EMPREENDIMENTO
create table public.user_empreendimentos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  empreendimento_id uuid not null,
  created_at timestamptz default now() not null,
  unique(user_id, empreendimento_id)
);

alter table public.user_empreendimentos enable row level security;

-- 7. TABELA DE LOG DE AUDITORIA
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  user_email text,
  action text not null check (action in ('create', 'update', 'delete', 'login', 'logout')),
  table_name text not null,
  record_id uuid,
  old_data jsonb,
  new_data jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz default now() not null
);

alter table public.audit_logs enable row level security;

-- Índices para performance
create index idx_audit_logs_user_id on public.audit_logs(user_id);
create index idx_audit_logs_table_name on public.audit_logs(table_name);
create index idx_audit_logs_created_at on public.audit_logs(created_at desc);
create index idx_user_roles_user_id on public.user_roles(user_id);
create index idx_user_empreendimentos_user_id on public.user_empreendimentos(user_id);
create index idx_role_permissions_role on public.role_permissions(role);

-- ===========================================
-- FUNÇÕES DE SEGURANÇA (SECURITY DEFINER)
-- ===========================================

-- Função: Verificar se usuário tem uma role específica
create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  )
$$;

-- Função: Obter a role do usuário
create or replace function public.get_user_role(_user_id uuid)
returns app_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.user_roles
  where user_id = _user_id
  limit 1
$$;

-- Função: Verificar se usuário é admin
create or replace function public.is_admin(_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_role(_user_id, 'admin')
$$;

-- Função: Verificar acesso a módulo
create or replace function public.can_access_module(
  _user_id uuid, 
  _module_name text, 
  _action text
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 
    from public.role_permissions rp
    join public.modules m on m.id = rp.module_id
    join public.user_roles ur on ur.role = rp.role
    where ur.user_id = _user_id
      and m.name = _module_name
      and m.is_active = true
      and (
        (_action = 'view' and rp.can_view) or
        (_action = 'create' and rp.can_create) or
        (_action = 'edit' and rp.can_edit) or
        (_action = 'delete' and rp.can_delete)
      )
  )
$$;

-- Função: Obter escopo de acesso a módulo
create or replace function public.get_module_scope(
  _user_id uuid, 
  _module_name text
)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select rp.scope
  from public.role_permissions rp
  join public.modules m on m.id = rp.module_id
  join public.user_roles ur on ur.role = rp.role
  where ur.user_id = _user_id
    and m.name = _module_name
  limit 1
$$;

-- Função: Verificar acesso a empreendimento
create or replace function public.can_access_empreendimento(
  _user_id uuid, 
  _empreendimento_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select 
    public.is_admin(_user_id) 
    or exists (
      select 1 from public.user_empreendimentos
      where user_id = _user_id 
        and empreendimento_id = _empreendimento_id
    )
$$;

-- ===========================================
-- POLÍTICAS RLS
-- ===========================================

-- PROFILES: Políticas
create policy "Users can view their own profile"
  on public.profiles for select
  to authenticated
  using (id = auth.uid());

create policy "Admins can view all profiles"
  on public.profiles for select
  to authenticated
  using (public.is_admin(auth.uid()));

create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "Admins can update any profile"
  on public.profiles for update
  to authenticated
  using (public.is_admin(auth.uid()));

create policy "System can insert profiles"
  on public.profiles for insert
  to authenticated
  with check (true);

create policy "Admins can delete profiles"
  on public.profiles for delete
  to authenticated
  using (public.is_admin(auth.uid()));

-- USER_ROLES: Políticas
create policy "Users can view their own role"
  on public.user_roles for select
  to authenticated
  using (user_id = auth.uid());

create policy "Admins can view all roles"
  on public.user_roles for select
  to authenticated
  using (public.is_admin(auth.uid()));

create policy "Admins can manage roles"
  on public.user_roles for all
  to authenticated
  using (public.is_admin(auth.uid()));

-- MODULES: Políticas (todos podem ver módulos ativos)
create policy "Authenticated users can view active modules"
  on public.modules for select
  to authenticated
  using (is_active = true);

create policy "Admins can manage modules"
  on public.modules for all
  to authenticated
  using (public.is_admin(auth.uid()));

-- ROLE_PERMISSIONS: Políticas
create policy "Authenticated users can view permissions"
  on public.role_permissions for select
  to authenticated
  using (true);

create policy "Admins can manage permissions"
  on public.role_permissions for all
  to authenticated
  using (public.is_admin(auth.uid()));

-- USER_EMPREENDIMENTOS: Políticas
create policy "Users can view their own empreendimento links"
  on public.user_empreendimentos for select
  to authenticated
  using (user_id = auth.uid());

create policy "Admins can view all empreendimento links"
  on public.user_empreendimentos for select
  to authenticated
  using (public.is_admin(auth.uid()));

create policy "Admins can manage empreendimento links"
  on public.user_empreendimentos for all
  to authenticated
  using (public.is_admin(auth.uid()));

-- AUDIT_LOGS: Políticas (apenas admins podem ver)
create policy "Admins can view audit logs"
  on public.audit_logs for select
  to authenticated
  using (public.is_admin(auth.uid()));

create policy "System can insert audit logs"
  on public.audit_logs for insert
  to authenticated
  with check (true);

-- ===========================================
-- TRIGGERS DE AUDITORIA
-- ===========================================

-- Função genérica de auditoria
create or replace function public.audit_trigger_func()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  _user_email text;
begin
  select email into _user_email from auth.users where id = auth.uid();
  
  if TG_OP = 'INSERT' then
    insert into public.audit_logs (user_id, user_email, action, table_name, record_id, new_data)
    values (auth.uid(), _user_email, 'create', TG_TABLE_NAME, NEW.id, to_jsonb(NEW));
    return NEW;
  elsif TG_OP = 'UPDATE' then
    insert into public.audit_logs (user_id, user_email, action, table_name, record_id, old_data, new_data)
    values (auth.uid(), _user_email, 'update', TG_TABLE_NAME, NEW.id, to_jsonb(OLD), to_jsonb(NEW));
    return NEW;
  elsif TG_OP = 'DELETE' then
    insert into public.audit_logs (user_id, user_email, action, table_name, record_id, old_data)
    values (auth.uid(), _user_email, 'delete', TG_TABLE_NAME, OLD.id, to_jsonb(OLD));
    return OLD;
  end if;
end;
$$;

-- Trigger para profiles
create trigger audit_profiles
  after insert or update or delete on public.profiles
  for each row execute function public.audit_trigger_func();

-- Trigger para user_roles
create trigger audit_user_roles
  after insert or update or delete on public.user_roles
  for each row execute function public.audit_trigger_func();

-- ===========================================
-- TRIGGER PARA CRIAR PERFIL AUTOMATICAMENTE
-- ===========================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    new.email
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ===========================================
-- TRIGGER PARA ATUALIZAR UPDATED_AT
-- ===========================================

create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  NEW.updated_at = now();
  return NEW;
end;
$$;

create trigger update_profiles_updated_at
  before update on public.profiles
  for each row execute function public.update_updated_at_column();

-- ===========================================
-- SEED: MÓDULOS DO SISTEMA
-- ===========================================

insert into public.modules (name, display_name, description, icon, route) values
  ('dashboard', 'Dashboard', 'Painel principal com KPIs e métricas', 'LayoutDashboard', '/'),
  ('empreendimentos', 'Empreendimentos', 'Gestão de empreendimentos imobiliários', 'Building2', '/empreendimentos'),
  ('unidades', 'Mapa de Unidades', 'Visualização e gestão de unidades', 'Map', '/mapa-unidades'),
  ('clientes', 'Clientes', 'Gestão de clientes e leads', 'Users', '/clientes'),
  ('propostas', 'Propostas', 'Gestão de propostas comerciais', 'FileText', '/propostas'),
  ('reservas', 'Reservas', 'Gestão de reservas de unidades', 'Calendar', '/reservas'),
  ('usuarios', 'Usuários', 'Gestão de usuários e permissões', 'UserCog', '/usuarios'),
  ('configuracoes', 'Configurações', 'Configurações do sistema', 'Settings', '/configuracoes'),
  ('relatorios', 'Relatórios', 'Relatórios gerenciais', 'BarChart3', '/relatorios'),
  ('auditoria', 'Auditoria', 'Logs de auditoria do sistema', 'Shield', '/auditoria');

-- ===========================================
-- SEED: PERMISSÕES POR PERFIL
-- ===========================================

-- ADMIN: Acesso total (VCUD Global)
insert into public.role_permissions (role, module_id, can_view, can_create, can_edit, can_delete, scope)
select 'admin'::app_role, id, true, true, true, true, 'global'
from public.modules;

-- GESTOR_PRODUTO: Acesso por empreendimento
insert into public.role_permissions (role, module_id, can_view, can_create, can_edit, can_delete, scope)
select 'gestor_produto'::app_role, id, 
  true,  -- can_view
  case when name in ('usuarios', 'auditoria', 'configuracoes') then false else true end,  -- can_create
  case when name in ('usuarios', 'auditoria') then false else true end,  -- can_edit
  false, -- can_delete (nunca pode excluir)
  case when name = 'configuracoes' then 'proprio' else 'empreendimento' end
from public.modules
where name not in ('auditoria');

-- INCORPORADOR: Somente leitura por empreendimento
insert into public.role_permissions (role, module_id, can_view, can_create, can_edit, can_delete, scope)
select 'incorporador'::app_role, id, 
  true,   -- can_view
  false,  -- can_create
  false,  -- can_edit
  false,  -- can_delete
  case when name = 'configuracoes' then 'proprio' else 'empreendimento' end
from public.modules
where name not in ('usuarios', 'auditoria');

-- CORRETOR: Acesso próprio limitado
insert into public.role_permissions (role, module_id, can_view, can_create, can_edit, can_delete, scope)
select 'corretor'::app_role, id, 
  true,  -- can_view
  case when name in ('propostas', 'reservas', 'clientes') then true else false end,  -- can_create
  case when name in ('propostas', 'reservas', 'clientes') then true else false end,  -- can_edit
  false, -- can_delete
  case 
    when name in ('propostas', 'reservas', 'clientes') then 'proprio'
    when name in ('empreendimentos', 'unidades') then 'empreendimento'
    else 'proprio'
  end
from public.modules
where name in ('dashboard', 'empreendimentos', 'unidades', 'clientes', 'propostas', 'reservas', 'configuracoes');