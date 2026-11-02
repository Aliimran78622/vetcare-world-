-- VetCare World Admin Library setup
-- Run this entire script once in Supabase SQL Editor.
-- Keeps your existing user_roles table and admin assignment.

create table if not exists public.media_library (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  category text not null check (category in ('books','photos','videos','notes')),
  file_path text not null unique,
  mime_type text not null default 'application/octet-stream',
  file_size bigint not null default 0 check (file_size >= 0),
  status text not null default 'draft' check (status in ('draft','published')),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now()
);

alter table public.media_library enable row level security;

-- Public visitors can read published items only.
drop policy if exists "Public can read published resources" on public.media_library;
create policy "Public can read published resources"
on public.media_library for select to anon, authenticated
using (status = 'published');

-- Approved admins can read every resource, including drafts.
drop policy if exists "Admins can read all resources" on public.media_library;
create policy "Admins can read all resources"
on public.media_library for select to authenticated
using (exists (
  select 1 from public.user_roles ur
  where ur.user_id = auth.uid() and ur.role = 'admin'
));

drop policy if exists "Admins can add resources" on public.media_library;
create policy "Admins can add resources"
on public.media_library for insert to authenticated
with check (
  created_by = auth.uid()
  and exists (select 1 from public.user_roles ur where ur.user_id = auth.uid() and ur.role = 'admin')
);

drop policy if exists "Admins can update resources" on public.media_library;
create policy "Admins can update resources"
on public.media_library for update to authenticated
using (exists (select 1 from public.user_roles ur where ur.user_id = auth.uid() and ur.role = 'admin'))
with check (exists (select 1 from public.user_roles ur where ur.user_id = auth.uid() and ur.role = 'admin'));

drop policy if exists "Admins can delete resources" on public.media_library;
create policy "Admins can delete resources"
on public.media_library for delete to authenticated
using (exists (select 1 from public.user_roles ur where ur.user_id = auth.uid() and ur.role = 'admin'));

-- Public bucket is required for public resource links. Upload/manage stays admin-only.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'vetcare-library', 'vetcare-library', true, 26214400,
  array['application/pdf','image/jpeg','image/png','image/webp','video/mp4','video/webm','text/plain','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Anyone can fetch files from this public bucket; only admins can change them.
drop policy if exists "Public can read VetCare library files" on storage.objects;
create policy "Public can read VetCare library files"
on storage.objects for select to anon, authenticated
using (bucket_id = 'vetcare-library');

drop policy if exists "Admins can upload VetCare library files" on storage.objects;
create policy "Admins can upload VetCare library files"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'vetcare-library'
  and exists (select 1 from public.user_roles ur where ur.user_id = auth.uid() and ur.role = 'admin')
);

drop policy if exists "Admins can update VetCare library files" on storage.objects;
create policy "Admins can update VetCare library files"
on storage.objects for update to authenticated
using (
  bucket_id = 'vetcare-library'
  and exists (select 1 from public.user_roles ur where ur.user_id = auth.uid() and ur.role = 'admin')
)
with check (
  bucket_id = 'vetcare-library'
  and exists (select 1 from public.user_roles ur where ur.user_id = auth.uid() and ur.role = 'admin')
);

drop policy if exists "Admins can delete VetCare library files" on storage.objects;
create policy "Admins can delete VetCare library files"
on storage.objects for delete to authenticated
using (
  bucket_id = 'vetcare-library'
  and exists (select 1 from public.user_roles ur where ur.user_id = auth.uid() and ur.role = 'admin')
);
