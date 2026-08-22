-- Admin role + workspace assignments. Run in the Supabase SQL Editor.

create table if not exists public.hr_app_users (
  email text primary key,
  name text not null,
  role text not null default 'hr',
  company text not null default 'aeris-beaute',
  updated_at timestamptz not null default now()
);

insert into public.hr_app_users (email, name, role, company) values
  ('dwiki@aerisbeaute.com', 'Dwiki', 'admin', 'both'),
  ('umaya@aerisbeaute.com', 'Umaya', 'hr', 'aeris-beaute'),
  ('fitria@fromthisisland.com', 'Fitria', 'hr', 'from-this-island')
on conflict (email) do nothing;

alter table public.hr_app_users enable row level security;

drop policy if exists hr_app_users_all on public.hr_app_users;
create policy hr_app_users_all
  on public.hr_app_users for all
  using (true) with check (true);
