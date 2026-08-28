-- IT notes on onboarding requests. Run in the SQL Editor.

alter table public.onboarding_requests
  add column if not exists it_notes text not null default '';
