-- Google Workspace temporary password on IT requests. Run in the SQL Editor.

alter table public.onboarding_requests
  add column if not exists work_password text not null default '';
