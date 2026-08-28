-- New vs replacement on IT requests. Run in the SQL Editor.

alter table public.onboarding_requests
  add column if not exists request_kind text not null default 'new';
