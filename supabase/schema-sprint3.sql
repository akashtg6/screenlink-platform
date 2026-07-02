-- =============================================================================
-- ScreenLink.ai — Sprint 3 Schema Delta (Project Management Module)
-- Adds columns to `projects` needed for wizard, filters, and progress tracking.
-- Idempotent — safe to run multiple times.
-- Run in Supabase SQL Editor after Sprint 2 schema.
-- =============================================================================

alter table public.projects add column if not exists description text;
alter table public.projects add column if not exists priority text check (priority in ('low','medium','high','critical'));
alter table public.projects add column if not exists target_completion_date date;
alter table public.projects add column if not exists progress_percent int not null default 0 check (progress_percent between 0 and 100);
alter table public.projects add column if not exists updated_by uuid references auth.users(id) on delete set null;

create index if not exists projects_priority_idx on public.projects(priority);
create index if not exists projects_progress_idx on public.projects(progress_percent);
create index if not exists projects_target_completion_date_idx on public.projects(target_completion_date);

-- Ensure updated_by is set on every write via a small trigger (best-effort).
create or replace function public.set_updated_by() returns trigger
language plpgsql as $$
begin
  if auth.uid() is not null then
    new.updated_by = auth.uid();
  end if;
  return new;
end;
$$;

drop trigger if exists set_updated_by on public.projects;
create trigger set_updated_by before insert or update on public.projects
for each row execute function public.set_updated_by();

-- Verify with:
--   select column_name, data_type from information_schema.columns
--   where table_schema='public' and table_name='projects' order by ordinal_position;
