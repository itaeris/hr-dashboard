-- Enable / disable the morning schedule reminder email. Run in Supabase SQL Editor.

create table if not exists public.schedule_alert_settings (
  company_slug text primary key,
  email_enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.schedule_alert_settings enable row level security;

drop policy if exists schedule_alert_settings_all on public.schedule_alert_settings;
create policy schedule_alert_settings_all on public.schedule_alert_settings
  for all using (true) with check (true);
