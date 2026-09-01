-- Daily overdue / due-today digest log. Run in Supabase SQL Editor.

create table if not exists public.schedule_alert_digests (
  company_slug text not null,
  sent_on date not null,
  overdue_count int not null default 0,
  due_today_count int not null default 0,
  created_at timestamptz not null default now(),
  primary key (company_slug, sent_on)
);

alter table public.schedule_alert_digests enable row level security;

drop policy if exists schedule_alert_digests_all on public.schedule_alert_digests;
create policy schedule_alert_digests_all on public.schedule_alert_digests
  for all using (true) with check (true);
