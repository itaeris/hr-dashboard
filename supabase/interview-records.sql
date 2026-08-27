-- Drive links for interview recordings. Run in the SQL Editor on existing projects.

alter table public.applications
  add column if not exists hr_interview_record_url text not null default '',
  add column if not exists user_interview_record_url text not null default '',
  add column if not exists third_interview_record_url text not null default '';
