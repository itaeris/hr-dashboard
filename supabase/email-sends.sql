-- Log of emails HR sent to candidates from the Send email modal.
-- Run in Supabase SQL Editor.

create table if not exists public.email_sends (
  id uuid primary key default gen_random_uuid(),
  company_slug text not null,
  application_id text not null,
  candidate_email text not null default '',
  kind text not null default '',
  subject text not null default '',
  sent_by text not null default '',
  sent_at timestamptz not null default now()
);

create index if not exists email_sends_application_idx
  on public.email_sends (application_id, sent_at desc);

alter table public.email_sends enable row level security;

drop policy if exists email_sends_all on public.email_sends;
create policy email_sends_all on public.email_sends
  for all using (true) with check (true);
