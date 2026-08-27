-- Email templates (subject, CC, body, attachments) per company workspace.
-- Run in the Supabase SQL Editor after schema.sql.

create table if not exists public.email_templates (
  company_slug text primary key,
  templates jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.email_templates enable row level security;

drop policy if exists email_templates_all on public.email_templates;
create policy email_templates_all
  on public.email_templates for all
  using (true) with check (true);
