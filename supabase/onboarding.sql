-- IT onboarding requests and laptop app checklist. Run in the SQL Editor.

create table if not exists public.onboarding_settings (
  company_slug text primary key,
  laptop_apps jsonb not null default '[]'::jsonb,
  it_email text not null default '',
  updated_at timestamptz not null default now()
);

create table if not exists public.onboarding_requests (
  id uuid primary key default gen_random_uuid(),
  company_slug text not null,
  application_id text not null,
  work_email text not null default '',
  request_kind text not null default 'new',
  laptop_needed boolean not null default true,
  laptop_status text not null default 'pending',
  laptop_apps jsonb not null default '{}'::jsonb,
  email_status text not null default 'pending',
  lark_status text not null default 'pending',
  notes text not null default '',
  it_notes text not null default '',
  requested_at timestamptz,
  requested_by text not null default '',
  ready_at timestamptz,
  joined boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_slug, application_id)
);

create index if not exists onboarding_requests_company_idx
  on public.onboarding_requests (company_slug);

alter table public.onboarding_settings enable row level security;
alter table public.onboarding_requests enable row level security;

drop policy if exists onboarding_settings_all on public.onboarding_settings;
drop policy if exists onboarding_requests_all on public.onboarding_requests;

create policy onboarding_settings_all
  on public.onboarding_settings for all
  using (true) with check (true);

create policy onboarding_requests_all
  on public.onboarding_requests for all
  using (true) with check (true);
