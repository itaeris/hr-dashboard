-- Google Calendar refresh tokens. Run in the Supabase SQL Editor.
-- Tokens are encrypted in the app with AUTH_SECRET before insert.

create table if not exists public.hr_google_tokens (
  email text primary key,
  refresh_cipher text not null,
  updated_at timestamptz not null default now()
);

alter table public.hr_google_tokens enable row level security;

drop policy if exists hr_google_tokens_all on public.hr_google_tokens;
revoke all on table public.hr_google_tokens from anon, authenticated;
