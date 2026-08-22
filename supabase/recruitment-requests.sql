-- Recruitment Request Form. Run in the Supabase SQL Editor.

create table if not exists public.recruitment_requests (
  id uuid primary key default gen_random_uuid(),
  company text not null,
  job_position text not null,
  min_job_level text not null default '',
  max_job_level text not null default '',
  workforce_type text not null default '',
  division text not null default '',
  department text not null default '',
  work_location text not null default '',
  headcount_number int not null default 1,
  headcount_type text not null default '',
  employee_replaced text not null default '',
  cost_center text not null default '',
  min_salary text not null default '',
  max_salary text not null default '',
  priority_level text not null default '',
  expected_join_date date,
  direct_supervisor text not null default '',
  indirect_supervisor text not null default '',
  job_description text not null default '',
  additional_notes text not null default '',
  assessment text not null default '',
  interviewers text not null default '',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.recruitment_requests
  add column if not exists payload jsonb not null default '{}'::jsonb;

-- Per-company form schemas. Replaces the old single-row (id = 1) table.
create table if not exists public.recruitment_form_settings (
  company text primary key,
  schema jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.recruitment_form_settings
  add column if not exists company text;

-- If the first version used id = 1, switch to company as the key:
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'recruitment_form_settings'
      and column_name = 'id'
  ) then
    update public.recruitment_form_settings
    set company = 'AERIS'
    where company is null;

    alter table public.recruitment_form_settings
      drop constraint if exists recruitment_form_settings_pkey;

    alter table public.recruitment_form_settings
      alter column company set not null;

    alter table public.recruitment_form_settings
      add primary key (company);

    alter table public.recruitment_form_settings
      drop column if exists id;
  end if;
end $$;

alter table public.recruitment_requests enable row level security;

drop policy if exists recruitment_requests_all on public.recruitment_requests;
create policy recruitment_requests_all
  on public.recruitment_requests for all
  using (true) with check (true);

alter table public.recruitment_form_settings enable row level security;
drop policy if exists recruitment_form_settings_all on public.recruitment_form_settings;
create policy recruitment_form_settings_all
  on public.recruitment_form_settings for all
  using (true) with check (true);
