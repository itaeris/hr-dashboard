-- Close anon/authenticated access to auth tables. The app reads these
-- with SUPABASE_SERVICE_ROLE_KEY on the server (bypasses RLS).
-- Run after adding that env var on Vercel.

drop policy if exists hr_app_users_all on public.hr_app_users;
drop policy if exists hr_auth_passwords_all on public.hr_auth_passwords;
drop policy if exists hr_google_tokens_all on public.hr_google_tokens;

revoke all on table public.hr_app_users from anon, authenticated;
revoke all on table public.hr_auth_passwords from anon, authenticated;
revoke all on table public.hr_google_tokens from anon, authenticated;
