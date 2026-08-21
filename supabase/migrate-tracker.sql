-- Jalankan di SQL Editor jika tabel jobs/applications sudah ada dari schema lama.

alter table public.jobs
  add column if not exists hire_type text not null default 'New',
  add column if not exists level text not null default 'Staff',
  add column if not exists hiring_manager text not null default '',
  add column if not exists recruiter_pic text not null default '',
  add column if not exists headcount_needed int not null default 1,
  add column if not exists request_date timestamptz not null default now(),
  add column if not exists sla_target int not null default 30,
  add column if not exists target_join timestamptz,
  add column if not exists status_vacancy text not null default 'Open',
  add column if not exists fulfilled_date timestamptz,
  add column if not exists offer_stage text not null default 'P1',
  add column if not exists priority text not null default 'Medium',
  add column if not exists notes text not null default '';

alter table public.applications
  add column if not exists latest_status text not null default 'Approaching',
  add column if not exists cv_url text,
  add column if not exists total_experience text not null default '',
  add column if not exists last_company text not null default '',
  add column if not exists last_role text not null default '',
  add column if not exists last_salary text not null default '',
  add column if not exists expected_salary text not null default '',
  add column if not exists approaching_date timestamptz,
  add column if not exists response_date timestamptz,
  add column if not exists hr_interview_date timestamptz,
  add column if not exists hr_interview_note text not null default '',
  add column if not exists shared_with_user boolean not null default false,
  add column if not exists user_interview_date timestamptz,
  add column if not exists user_remarks text not null default '',
  add column if not exists third_interview_date timestamptz,
  add column if not exists offer_date timestamptz,
  add column if not exists offer_result text,
  add column if not exists join_date timestamptz,
  add column if not exists last_stage_date timestamptz,
  add column if not exists rejection_letter boolean not null default false;
