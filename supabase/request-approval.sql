-- Approval status for recruitment requests. Run in the Supabase SQL Editor.

alter table public.recruitment_requests
  add column if not exists approval_status text not null default 'pending',
  add column if not exists approval_comment text not null default '',
  add column if not exists approval_decided_at timestamptz,
  add column if not exists approval_decided_by text not null default '';

alter table public.recruitment_requests
  drop constraint if exists recruitment_requests_approval_status_check;

alter table public.recruitment_requests
  add constraint recruitment_requests_approval_status_check
  check (approval_status in ('pending', 'approved', 'rejected'));
