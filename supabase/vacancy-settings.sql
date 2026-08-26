-- Vacancy level dropdown options, per company workspace.
-- Run in the Supabase SQL Editor after schema.sql.

create table if not exists public.vacancy_settings (
  company_slug text primary key,
  levels jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.vacancy_settings enable row level security;

drop policy if exists vacancy_settings_all on public.vacancy_settings;
create policy vacancy_settings_all
  on public.vacancy_settings for all
  using (true) with check (true);
