-- =============================================================================
-- ScreenLink.ai — Production Schema
-- Multi-tenant (Organizations) with role-based access control (RBAC)
-- Roles: super_admin, organization_admin, engineer, sales, viewer
-- Idempotent — safe to run repeatedly.
-- =============================================================================

create extension if not exists "pgcrypto";

-- =============================================================================
-- ROLES (system-defined)
-- =============================================================================
create table if not exists public.roles (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        text not null,
  description text,
  hierarchy   int  not null default 0,  -- higher = more privileged
  is_system   boolean not null default true,
  created_at  timestamptz not null default now()
);

comment on table public.roles is
  'System roles. Permissions can be attached to a separate role_permissions table later without schema changes.';

insert into public.roles (slug, name, description, hierarchy, is_system) values
  ('super_admin',        'Super Admin',        'Platform-level administrator (ScreenLink staff)', 100, true),
  ('organization_admin', 'Organization Admin', 'Full control within their organization',           80,  true),
  ('engineer',           'Engineer',           'Creates and manages engineering projects',         60,  true),
  ('sales',              'Sales',              'Creates proposals; read access to engineering',    40,  true),
  ('viewer',             'Viewer',             'Read-only access to organization data',            20,  true)
on conflict (slug) do nothing;

-- =============================================================================
-- ORGANIZATIONS (tenant boundary)
-- =============================================================================
create table if not exists public.organizations (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text unique,
  logo_url    text,
  website     text,
  industry    text,
  country     text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists organizations_slug_idx    on public.organizations(slug);
create index if not exists organizations_country_idx on public.organizations(country);

-- =============================================================================
-- PROFILES (1:1 with auth.users, tenant-scoped by organization_id)
-- =============================================================================
create table if not exists public.profiles (
  id                uuid primary key references auth.users(id) on delete cascade,
  email             text not null,
  full_name         text,
  avatar_url        text,
  job_title         text,
  organization_id   uuid references public.organizations(id) on delete set null,
  role_id           uuid not null references public.roles(id),
  is_active         boolean not null default true,
  last_sign_in_at   timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists profiles_organization_id_idx on public.profiles(organization_id);
create index if not exists profiles_role_id_idx         on public.profiles(role_id);
create index if not exists profiles_email_idx           on public.profiles(email);

-- =============================================================================
-- PROJECTS (belong to organization, NOT user)
-- =============================================================================
do $$ begin
  create type public.project_status as enum ('draft','in_review','approved','delivered','archived');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.display_type as enum ('led_indoor','led_outdoor','lcd_video_wall','interactive');
exception when duplicate_object then null; end $$;

create table if not exists public.projects (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  code             text not null,
  name             text not null,
  status           public.project_status not null default 'draft',
  display_type     public.display_type,
  customer         jsonb not null default '{}'::jsonb,
  requirements     jsonb not null default '{}'::jsonb,
  location         text,
  budget_usd       numeric(14,2),
  created_by       uuid references auth.users(id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique(organization_id, code)
);

create index if not exists projects_organization_id_idx on public.projects(organization_id);
create index if not exists projects_status_idx          on public.projects(status);
create index if not exists projects_created_by_idx     on public.projects(created_by);
create index if not exists projects_updated_at_idx     on public.projects(updated_at desc);

-- =============================================================================
-- HELPER FUNCTIONS (used by RLS)
-- =============================================================================
create or replace function public.current_organization_id() returns uuid
language sql stable security definer set search_path = public as $$
  select organization_id from public.profiles where id = auth.uid();
$$;

create or replace function public.current_role_slug() returns text
language sql stable security definer set search_path = public as $$
  select r.slug from public.profiles p
  join public.roles r on r.id = p.role_id
  where p.id = auth.uid();
$$;

create or replace function public.has_role(role_slug text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles p
    join public.roles r on r.id = p.role_id
    where p.id = auth.uid()
      and (r.slug = role_slug or r.slug = 'super_admin')
  );
$$;

create or replace function public.has_any_role(role_slugs text[]) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles p
    join public.roles r on r.id = p.role_id
    where p.id = auth.uid()
      and (r.slug = any(role_slugs) or r.slug = 'super_admin')
  );
$$;

-- =============================================================================
-- UPDATED_AT TRIGGERS
-- =============================================================================
create or replace function public.set_updated_at() returns trigger
language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists set_updated_at on public.organizations;
create trigger set_updated_at before update on public.organizations
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.profiles;
create trigger set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.projects;
create trigger set_updated_at before update on public.projects
for each row execute function public.set_updated_at();

-- =============================================================================
-- AUTO-PROVISION ORGANIZATION + PROFILE ON USER SIGNUP
-- Default role: engineer. Every new signup gets a fresh single-tenant workspace.
-- =============================================================================
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  default_role_id uuid;
  new_org_id      uuid;
  fullname        text;
  orgname         text;
begin
  fullname := coalesce(
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name',
    split_part(new.email, '@', 1)
  );

  orgname := coalesce(
    nullif(new.raw_user_meta_data->>'organization', ''),
    fullname || ' Workspace'
  );

  select id into default_role_id from public.roles where slug = 'engineer' limit 1;

  insert into public.organizations (name, country)
  values (orgname, nullif(new.raw_user_meta_data->>'country', ''))
  returning id into new_org_id;

  insert into public.profiles (
    id, email, full_name, avatar_url, organization_id, role_id
  ) values (
    new.id,
    new.email,
    fullname,
    nullif(new.raw_user_meta_data->>'avatar_url', ''),
    new_org_id,
    default_role_id
  );

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================
alter table public.roles         enable row level security;
alter table public.organizations enable row level security;
alter table public.profiles      enable row level security;
alter table public.projects      enable row level security;

-- ROLES: readable by any authenticated user
drop policy if exists roles_read on public.roles;
create policy roles_read on public.roles
for select to authenticated using (true);

-- ORGANIZATIONS
drop policy if exists organizations_read on public.organizations;
create policy organizations_read on public.organizations
for select to authenticated using (
  id = public.current_organization_id() or public.has_role('super_admin')
);

drop policy if exists organizations_update on public.organizations;
create policy organizations_update on public.organizations
for update to authenticated using (
  (id = public.current_organization_id() and public.has_any_role(array['organization_admin']))
  or public.has_role('super_admin')
) with check (
  (id = public.current_organization_id() and public.has_any_role(array['organization_admin']))
  or public.has_role('super_admin')
);

drop policy if exists organizations_insert on public.organizations;
create policy organizations_insert on public.organizations
for insert to authenticated with check (public.has_role('super_admin'));

-- PROFILES
drop policy if exists profiles_read on public.profiles;
create policy profiles_read on public.profiles
for select to authenticated using (
  id = auth.uid()
  or organization_id = public.current_organization_id()
  or public.has_role('super_admin')
);

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles
for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists profiles_update_org_admin on public.profiles;
create policy profiles_update_org_admin on public.profiles
for update to authenticated using (
  (organization_id = public.current_organization_id() and public.has_role('organization_admin'))
  or public.has_role('super_admin')
) with check (
  (organization_id = public.current_organization_id() and public.has_role('organization_admin'))
  or public.has_role('super_admin')
);

-- PROJECTS
drop policy if exists projects_read on public.projects;
create policy projects_read on public.projects
for select to authenticated using (
  organization_id = public.current_organization_id() or public.has_role('super_admin')
);

drop policy if exists projects_insert on public.projects;
create policy projects_insert on public.projects
for insert to authenticated with check (
  organization_id = public.current_organization_id()
  and public.has_any_role(array['organization_admin','engineer'])
);

drop policy if exists projects_update on public.projects;
create policy projects_update on public.projects
for update to authenticated using (
  organization_id = public.current_organization_id()
  and public.has_any_role(array['organization_admin','engineer','sales'])
) with check (
  organization_id = public.current_organization_id()
  and public.has_any_role(array['organization_admin','engineer','sales'])
);

drop policy if exists projects_delete on public.projects;
create policy projects_delete on public.projects
for delete to authenticated using (
  organization_id = public.current_organization_id()
  and public.has_role('organization_admin')
);

-- =============================================================================
-- GRANTS
-- =============================================================================
grant usage on schema public to authenticated, anon;
grant select                          on public.roles         to authenticated;
grant select, update                  on public.organizations to authenticated;
grant select, update                  on public.profiles      to authenticated;
grant select, insert, update, delete  on public.projects      to authenticated;

-- =============================================================================
-- DONE. Verify with:
--   select * from public.roles;
-- After signup: select * from public.profiles;
-- =============================================================================
