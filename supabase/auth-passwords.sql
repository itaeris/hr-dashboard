-- Password overrides for Settings → Change password.
-- Run in the Supabase SQL Editor.

create table if not exists public.hr_auth_passwords (
  email text primary key,
  salt text not null,
  hash text not null,
  name text not null default '',
  role text not null default 'hr',
  updated_at timestamptz not null default now()
);

alter table public.hr_auth_passwords enable row level security;

drop policy if exists hr_auth_passwords_all on public.hr_auth_passwords;
create policy hr_auth_passwords_all
  on public.hr_auth_passwords for all
  using (true) with check (true);
