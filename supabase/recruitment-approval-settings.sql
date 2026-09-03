-- Approval process members (CC / HR / Handle), per company workspace.
-- Run in the Supabase SQL Editor.

create table if not exists public.recruitment_approval_settings (
  company_slug text primary key,
  leader_cc jsonb not null default '[]'::jsonb,
  hr_approvers jsonb not null default '[]'::jsonb,
  handle_members jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.recruitment_approval_settings enable row level security;

drop policy if exists recruitment_approval_settings_all on public.recruitment_approval_settings;
create policy recruitment_approval_settings_all
  on public.recruitment_approval_settings for all
  using (true) with check (true);
