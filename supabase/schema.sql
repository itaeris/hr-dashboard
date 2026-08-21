-- HR Recruitment Dashboard — Aeris Beaute & From This Island
-- Jalankan file ini di Supabase SQL Editor (urut dari atas ke bawah).

create extension if not exists "pgcrypto";

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  tagline text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  hire_type text not null default 'New',
  title text not null,
  level text not null default 'Staff',
  department text not null,
  hiring_manager text not null default '',
  recruiter_pic text not null default '',
  headcount_needed int not null default 1,
  request_date timestamptz not null default now(),
  sla_target int not null default 30,
  target_join timestamptz,
  status_vacancy text not null default 'Open',
  fulfilled_date timestamptz,
  offer_stage text not null default 'P1',
  priority text not null default 'Medium',
  notes text not null default '',
  location text,
  type text,
  status text,
  description text,
  openings int,
  created_at timestamptz not null default now()
);

create table if not exists public.candidates (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  full_name text not null,
  email text not null,
  phone text,
  source text not null default 'Website',
  location text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.candidates(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  stage text not null default 'applied' check (
    stage in ('applied', 'screening', 'interview', 'offer', 'hired', 'rejected')
  ),
  rating int check (rating is null or (rating >= 1 and rating <= 5)),
  latest_status text not null default 'Approaching',
  cv_url text,
  total_experience text not null default '',
  last_company text not null default '',
  last_role text not null default '',
  last_salary text not null default '',
  expected_salary text not null default '',
  approaching_date timestamptz,
  response_date timestamptz,
  hr_interview_date timestamptz,
  hr_interview_note text not null default '',
  shared_with_user boolean not null default false,
  user_interview_date timestamptz,
  user_remarks text not null default '',
  third_interview_date timestamptz,
  offer_date timestamptz,
  offer_result text,
  join_date timestamptz,
  last_stage_date timestamptz,
  rejection_letter boolean not null default false,
  next_interview timestamptz,
  applied_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists jobs_company_idx on public.jobs (company_id);
create index if not exists candidates_company_idx on public.candidates (company_id);
create index if not exists applications_job_idx on public.applications (job_id);
create index if not exists applications_stage_idx on public.applications (stage);

alter table public.companies enable row level security;
alter table public.jobs enable row level security;
alter table public.candidates enable row level security;
alter table public.applications enable row level security;

drop policy if exists companies_all on public.companies;
drop policy if exists jobs_all on public.jobs;
drop policy if exists candidates_all on public.candidates;
drop policy if exists applications_all on public.applications;

create policy companies_all on public.companies for all using (true) with check (true);
create policy jobs_all on public.jobs for all using (true) with check (true);
create policy candidates_all on public.candidates for all using (true) with check (true);
create policy applications_all on public.applications for all using (true) with check (true);

-- Seed
insert into public.companies (id, slug, name, tagline) values
  ('a1b2c3d4-1111-4111-8111-111111111111', 'aeris-beaute', 'Aeris Beaute', 'Beauty that feels like air'),
  ('a1b2c3d4-2222-4222-8222-222222222222', 'from-this-island', 'From This Island', 'Crafted from the archipelago')
on conflict (slug) do nothing;

insert into public.jobs (id, company_id, title, department, location, type, status, openings, created_at, description) values
  ('aaaaaaaa-0001-4000-8000-000000000001', 'a1b2c3d4-1111-4111-8111-111111111111', 'Beauty Advisor', 'Retail', 'Jakarta · SCBD', 'full-time', 'open', 3, '2026-06-12T03:00:00Z', 'Membantu tamu menemukan ritual skincare Aeris, merawat pengalaman toko, dan mencapai target penjualan dengan pendekatan konsultatif.'),
  ('aaaaaaaa-0001-4000-8000-000000000002', 'a1b2c3d4-1111-4111-8111-111111111111', 'Store Manager', 'Retail', 'Bandung · Cihampelas', 'full-time', 'open', 1, '2026-07-02T03:00:00Z', 'Memimpin operasional boutique, coaching tim advisor, dan menjaga standar visual merchandising Aeris Beaute.'),
  ('aaaaaaaa-0001-4000-8000-000000000003', 'a1b2c3d4-1111-4111-8111-111111111111', 'Social Media Specialist', 'Marketing', 'Jakarta · Hybrid', 'full-time', 'open', 1, '2026-07-18T03:00:00Z', 'Mengelola konten harian Instagram & TikTok, merawat tone of voice, dan mengorkestrasi kolaborasi kreator.'),
  ('aaaaaaaa-0001-4000-8000-000000000004', 'a1b2c3d4-1111-4111-8111-111111111111', 'Product Formulation Intern', 'R&D', 'Tangerang', 'internship', 'open', 2, '2026-08-01T03:00:00Z', 'Mendukung tim lab dalam uji stabilitas, dokumentasi formula, dan riset bahan aktif lokal.'),
  ('aaaaaaaa-0001-4000-8000-000000000005', 'a1b2c3d4-1111-4111-8111-111111111111', 'Warehouse Coordinator', 'Operations', 'Bekasi', 'contract', 'closed', 1, '2026-04-20T03:00:00Z', 'Mengatur inbound/outbound, cycle count, dan SLA pengiriman ke toko serta marketplace.'),
  ('aaaaaaaa-0002-4000-8000-000000000001', 'a1b2c3d4-2222-4222-8222-222222222222', 'Barista', 'F&B', 'Ubud', 'full-time', 'open', 2, '2026-06-28T03:00:00Z', 'Meracik kopi dan minuman signature From This Island, merawat guest experience, dan menjaga ritme bar.'),
  ('aaaaaaaa-0002-4000-8000-000000000002', 'a1b2c3d4-2222-4222-8222-222222222222', 'Brand Storyteller', 'Marketing', 'Canggu · Hybrid', 'full-time', 'open', 1, '2026-07-10T03:00:00Z', 'Menulis narasi produk, dokumentasi petani mitra, dan konten editorial untuk kanal digital.'),
  ('aaaaaaaa-0002-4000-8000-000000000003', 'a1b2c3d4-2222-4222-8222-222222222222', 'Retail Associate', 'Retail', 'Jakarta · Senopati', 'part-time', 'open', 2, '2026-07-22T03:00:00Z', 'Menyambut tamu di concept store, merawat display, dan menceritakan asal-usul setiap produk.'),
  ('aaaaaaaa-0002-4000-8000-000000000004', 'a1b2c3d4-2222-4222-8222-222222222222', 'Head of Operations', 'Operations', 'Bali', 'full-time', 'open', 1, '2026-05-15T03:00:00Z', 'Menyatukan supply chain kebun–dapur–toko, SLA produksi, dan standar kualitas lintas outlet.'),
  ('aaaaaaaa-0002-4000-8000-000000000005', 'a1b2c3d4-2222-4222-8222-222222222222', 'Product Developer F&B', 'R&D', 'Tabanan', 'contract', 'open', 1, '2026-08-05T03:00:00Z', 'Mengembangkan menu musiman berbasis bahan lokal: kakao, kelapa, rempah, dan hasil kebun mitra.')
on conflict (id) do nothing;

insert into public.candidates (id, company_id, full_name, email, phone, source, location, notes, created_at) values
  ('bbbbbbbb-0001-4000-8000-000000000001', 'a1b2c3d4-1111-4111-8111-111111111111', 'Sari Melati', 'sari.melati@email.com', '0812-1100-2211', 'Instagram', 'Jakarta Selatan', 'Pengalaman 3 tahun di Sephora. Portofolio makeup editorial kuat.', '2026-08-18T04:12:00Z'),
  ('bbbbbbbb-0001-4000-8000-000000000002', 'a1b2c3d4-1111-4111-8111-111111111111', 'Nadia Putri', 'nadia.putri@email.com', '0813-4455-6677', 'LinkedIn', 'Bandung', 'Ex store supervisor The Body Shop. Siap relokasi.', '2026-08-10T07:40:00Z'),
  ('bbbbbbbb-0001-4000-8000-000000000003', 'a1b2c3d4-1111-4111-8111-111111111111', 'Kevin Pratama', 'kevin.pratama@email.com', '0857-9000-1122', 'Referral', 'Tangerang', 'Direferensikan oleh tim R&D. Lulusan farmasi UI.', '2026-08-04T02:15:00Z'),
  ('bbbbbbbb-0001-4000-8000-000000000004', 'a1b2c3d4-1111-4111-8111-111111111111', 'Ayu Lestari', 'ayu.lestari@email.com', '0819-3333-4444', 'Website', 'Depok', 'Content creator skincare 42k followers. Tone of voice match.', '2026-08-14T09:05:00Z'),
  ('bbbbbbbb-0001-4000-8000-000000000005', 'a1b2c3d4-1111-4111-8111-111111111111', 'Dimas Wijaya', 'dimas.wijaya@email.com', '0821-7788-9900', 'JobStreet', 'Bekasi', 'Warehouse lead 4 tahun. Shift malam OK.', '2026-05-02T01:20:00Z'),
  ('bbbbbbbb-0001-4000-8000-000000000006', 'a1b2c3d4-1111-4111-8111-111111111111', 'Farah Anindya', 'farah.anindya@email.com', '0812-5555-0101', 'LinkedIn', 'Jakarta Pusat', 'Wawancara user selesai. Menunggu offering letter.', '2026-07-28T06:30:00Z'),
  ('bbbbbbbb-0001-4000-8000-000000000007', 'a1b2c3d4-1111-4111-8111-111111111111', 'Raka Setiawan', 'raka.setiawan@email.com', '0878-1212-3434', 'Campus', 'Yogyakarta', 'Fresh graduate UGM kimia. Butuh screening English.', '2026-08-16T03:45:00Z'),
  ('bbbbbbbb-0001-4000-8000-000000000008', 'a1b2c3d4-1111-4111-8111-111111111111', 'Michelle Tan', 'michelle.tan@email.com', '0816-9090-8080', 'Referral', 'Jakarta Utara', 'Join date 1 September. Onboarding pack sudah dikirim.', '2026-07-12T08:00:00Z'),
  ('bbbbbbbb-0001-4000-8000-000000000009', 'a1b2c3d4-1111-4111-8111-111111111111', 'Intan Permata', 'intan.permata@email.com', '0852-7777-1212', 'Instagram', 'Surabaya', 'Tidak match dengan jam operasional toko.', '2026-08-06T05:10:00Z'),
  ('bbbbbbbb-0001-4000-8000-000000000010', 'a1b2c3d4-1111-4111-8111-111111111111', 'Clara Wijaya', 'clara.wijaya@email.com', '0813-2222-9898', 'Website', 'Tangerang Selatan', 'Portfolio Figma + capcut sangat rapi.', '2026-08-19T11:22:00Z'),
  ('bbbbbbbb-0001-4000-8000-000000000011', 'a1b2c3d4-1111-4111-8111-111111111111', 'Budi Santoso', 'budi.santoso@email.com', '0812-3434-5656', 'Walk-in', 'Bandung', 'Walk-in boutique Bandung. Perlu tes leadership case.', '2026-08-12T02:50:00Z'),
  ('bbbbbbbb-0002-4000-8000-000000000001', 'a1b2c3d4-2222-4222-8222-222222222222', 'Made Arya', 'made.arya@email.com', '0812-7000-1100', 'Walk-in', 'Ubud', 'Barista 5 tahun, latte art kompetisi Bali 2025.', '2026-08-17T04:00:00Z'),
  ('bbbbbbbb-0002-4000-8000-000000000002', 'a1b2c3d4-2222-4222-8222-222222222222', 'Kadek Sinta', 'kadek.sinta@email.com', '0813-8080-9090', 'Instagram', 'Canggu', 'Menulis untuk Slow Food Bali. Bahasa Inggris fasih.', '2026-08-08T06:20:00Z'),
  ('bbbbbbbb-0002-4000-8000-000000000003', 'a1b2c3d4-2222-4222-8222-222222222222', 'Jonathan Lim', 'jonathan.lim@email.com', '0816-1111-2222', 'LinkedIn', 'Singapore / Bali', 'Ex ops lead F&B group. Open to relocate Q4.', '2026-07-21T03:10:00Z'),
  ('bbbbbbbb-0002-4000-8000-000000000004', 'a1b2c3d4-2222-4222-8222-222222222222', 'Putu Devi', 'putu.devi@email.com', '0857-3333-4444', 'Referral', 'Denpasar', 'Direferensikan chef dapur Tabanan.', '2026-08-11T09:40:00Z'),
  ('bbbbbbbb-0002-4000-8000-000000000005', 'a1b2c3d4-2222-4222-8222-222222222222', 'Andi Rahman', 'andi.rahman@email.com', '0821-5555-6666', 'Website', 'Jakarta', 'Retail weekend only. Cocok untuk Senopati.', '2026-08-15T01:05:00Z'),
  ('bbbbbbbb-0002-4000-8000-000000000006', 'a1b2c3d4-2222-4222-8222-222222222222', 'Luh Ayu Komang', 'luh.ayu@email.com', '0819-7777-8888', 'Campus', 'Tabanan', 'Lulusan STP Bali. Magang di hotel 5*.', '2026-08-03T07:15:00Z'),
  ('bbbbbbbb-0002-4000-8000-000000000007', 'a1b2c3d4-2222-4222-8222-222222222222', 'Reza Fauzan', 'reza.fauzan@email.com', '0878-9999-0000', 'LinkedIn', 'Bandung', 'Offering dikirim 18 Agu. Menunggu signed letter.', '2026-07-30T04:44:00Z'),
  ('bbbbbbbb-0002-4000-8000-000000000008', 'a1b2c3d4-2222-4222-8222-222222222222', 'Ni Wayan Sari', 'wayan.sari@email.com', '0812-1212-3434', 'Referral', 'Ubud', 'Hired sebagai barista lead. Join 25 Agustus.', '2026-07-08T02:00:00Z'),
  ('bbbbbbbb-0002-4000-8000-000000000009', 'a1b2c3d4-2222-4222-8222-222222222222', 'Sarah Chen', 'sarah.chen@email.com', '0813-4545-6767', 'JobStreet', 'Seminyak', 'Ekspektasi gaji di atas band. Ditahan dulu.', '2026-08-02T08:30:00Z'),
  ('bbbbbbbb-0002-4000-8000-000000000010', 'a1b2c3d4-2222-4222-8222-222222222222', 'Gede Wirawan', 'gede.wirawan@email.com', '0852-8888-9999', 'Walk-in', 'Gianyar', 'Trial shift bar sudah dijadwalkan.', '2026-08-19T03:18:00Z'),
  ('bbbbbbbb-0002-4000-8000-000000000011', 'a1b2c3d4-2222-4222-8222-222222222222', 'Maya Kusuma', 'maya.kusuma@email.com', '0812-6000-7000', 'Instagram', 'Jakarta Selatan', 'Copywriter freelance. Portfolio match tone island.', '2026-08-13T10:12:00Z')
on conflict (id) do nothing;

insert into public.applications (id, candidate_id, job_id, stage, rating, next_interview, applied_at, updated_at) values
  ('cccccccc-0001-4000-8000-000000000001', 'bbbbbbbb-0001-4000-8000-000000000001', 'aaaaaaaa-0001-4000-8000-000000000001', 'applied', 4, null, '2026-08-18T04:12:00Z', '2026-08-18T04:12:00Z'),
  ('cccccccc-0001-4000-8000-000000000002', 'bbbbbbbb-0001-4000-8000-000000000002', 'aaaaaaaa-0001-4000-8000-000000000002', 'interview', 5, '2026-08-21T07:00:00Z', '2026-08-10T07:40:00Z', '2026-08-19T02:00:00Z'),
  ('cccccccc-0001-4000-8000-000000000003', 'bbbbbbbb-0001-4000-8000-000000000003', 'aaaaaaaa-0001-4000-8000-000000000004', 'screening', 4, '2026-08-22T04:00:00Z', '2026-08-04T02:15:00Z', '2026-08-17T09:00:00Z'),
  ('cccccccc-0001-4000-8000-000000000004', 'bbbbbbbb-0001-4000-8000-000000000004', 'aaaaaaaa-0001-4000-8000-000000000003', 'interview', 5, '2026-08-24T08:30:00Z', '2026-08-14T09:05:00Z', '2026-08-18T03:20:00Z'),
  ('cccccccc-0001-4000-8000-000000000005', 'bbbbbbbb-0001-4000-8000-000000000005', 'aaaaaaaa-0001-4000-8000-000000000005', 'hired', 4, null, '2026-05-02T01:20:00Z', '2026-05-28T01:20:00Z'),
  ('cccccccc-0001-4000-8000-000000000006', 'bbbbbbbb-0001-4000-8000-000000000006', 'aaaaaaaa-0001-4000-8000-000000000003', 'offer', 5, null, '2026-07-28T06:30:00Z', '2026-08-15T06:30:00Z'),
  ('cccccccc-0001-4000-8000-000000000007', 'bbbbbbbb-0001-4000-8000-000000000007', 'aaaaaaaa-0001-4000-8000-000000000004', 'applied', 3, null, '2026-08-16T03:45:00Z', '2026-08-16T03:45:00Z'),
  ('cccccccc-0001-4000-8000-000000000008', 'bbbbbbbb-0001-4000-8000-000000000008', 'aaaaaaaa-0001-4000-8000-000000000001', 'hired', 5, null, '2026-07-12T08:00:00Z', '2026-08-08T08:00:00Z'),
  ('cccccccc-0001-4000-8000-000000000009', 'bbbbbbbb-0001-4000-8000-000000000009', 'aaaaaaaa-0001-4000-8000-000000000001', 'rejected', 2, null, '2026-08-06T05:10:00Z', '2026-08-12T05:10:00Z'),
  ('cccccccc-0001-4000-8000-000000000010', 'bbbbbbbb-0001-4000-8000-000000000010', 'aaaaaaaa-0001-4000-8000-000000000003', 'screening', 4, '2026-08-21T10:00:00Z', '2026-08-19T11:22:00Z', '2026-08-20T01:00:00Z'),
  ('cccccccc-0001-4000-8000-000000000011', 'bbbbbbbb-0001-4000-8000-000000000011', 'aaaaaaaa-0001-4000-8000-000000000002', 'screening', 3, null, '2026-08-12T02:50:00Z', '2026-08-13T02:50:00Z'),
  ('cccccccc-0002-4000-8000-000000000001', 'bbbbbbbb-0002-4000-8000-000000000001', 'aaaaaaaa-0002-4000-8000-000000000001', 'interview', 5, '2026-08-21T06:00:00Z', '2026-08-17T04:00:00Z', '2026-08-19T04:00:00Z'),
  ('cccccccc-0002-4000-8000-000000000002', 'bbbbbbbb-0002-4000-8000-000000000002', 'aaaaaaaa-0002-4000-8000-000000000002', 'offer', 5, null, '2026-08-08T06:20:00Z', '2026-08-18T06:20:00Z'),
  ('cccccccc-0002-4000-8000-000000000003', 'bbbbbbbb-0002-4000-8000-000000000003', 'aaaaaaaa-0002-4000-8000-000000000004', 'interview', 4, '2026-08-25T03:00:00Z', '2026-07-21T03:10:00Z', '2026-08-16T03:10:00Z'),
  ('cccccccc-0002-4000-8000-000000000004', 'bbbbbbbb-0002-4000-8000-000000000004', 'aaaaaaaa-0002-4000-8000-000000000005', 'screening', 4, '2026-08-22T07:30:00Z', '2026-08-11T09:40:00Z', '2026-08-18T09:40:00Z'),
  ('cccccccc-0002-4000-8000-000000000005', 'bbbbbbbb-0002-4000-8000-000000000005', 'aaaaaaaa-0002-4000-8000-000000000003', 'applied', 3, null, '2026-08-15T01:05:00Z', '2026-08-15T01:05:00Z'),
  ('cccccccc-0002-4000-8000-000000000006', 'bbbbbbbb-0002-4000-8000-000000000006', 'aaaaaaaa-0002-4000-8000-000000000001', 'applied', 4, null, '2026-08-03T07:15:00Z', '2026-08-03T07:15:00Z'),
  ('cccccccc-0002-4000-8000-000000000007', 'bbbbbbbb-0002-4000-8000-000000000007', 'aaaaaaaa-0002-4000-8000-000000000005', 'offer', 4, null, '2026-07-30T04:44:00Z', '2026-08-18T04:44:00Z'),
  ('cccccccc-0002-4000-8000-000000000008', 'bbbbbbbb-0002-4000-8000-000000000008', 'aaaaaaaa-0002-4000-8000-000000000001', 'hired', 5, null, '2026-07-08T02:00:00Z', '2026-08-05T02:00:00Z'),
  ('cccccccc-0002-4000-8000-000000000009', 'bbbbbbbb-0002-4000-8000-000000000009', 'aaaaaaaa-0002-4000-8000-000000000004', 'rejected', 2, null, '2026-08-02T08:30:00Z', '2026-08-14T08:30:00Z'),
  ('cccccccc-0002-4000-8000-000000000010', 'bbbbbbbb-0002-4000-8000-000000000010', 'aaaaaaaa-0002-4000-8000-000000000001', 'screening', 4, '2026-08-21T09:00:00Z', '2026-08-19T03:18:00Z', '2026-08-20T03:18:00Z'),
  ('cccccccc-0002-4000-8000-000000000011', 'bbbbbbbb-0002-4000-8000-000000000011', 'aaaaaaaa-0002-4000-8000-000000000002', 'screening', 5, '2026-08-23T04:30:00Z', '2026-08-13T10:12:00Z', '2026-08-19T10:12:00Z')
on conflict (id) do nothing;
