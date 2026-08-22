-- CV attachments. Run in the Supabase SQL Editor after schema.sql.
-- If this bucket is missing, the app still stores the file inline as a fallback.

insert into storage.buckets (id, name, public)
values ('cvs', 'cvs', true)
on conflict (id) do nothing;

drop policy if exists cvs_public_read on storage.objects;
drop policy if exists cvs_public_write on storage.objects;

create policy cvs_public_read
  on storage.objects for select
  using (bucket_id = 'cvs');

create policy cvs_public_write
  on storage.objects for insert
  with check (bucket_id = 'cvs');
