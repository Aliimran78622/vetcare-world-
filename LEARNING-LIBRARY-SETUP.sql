-- VetCare World Learning Library
-- Run once in Supabase > SQL Editor. Public read/download; admin-only upload/edit/delete.

create table if not exists public.media_library (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  category text not null default 'other',
  file_path text not null unique,
  mime_type text not null default 'application/octet-stream',
  file_size bigint not null default 0 check (file_size >= 0),
  status text not null default 'draft',
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now()
);

-- Add compatibility columns used by the website uploader and public cards.
alter table public.media_library add column if not exists file_name text;
alter table public.media_library add column if not exists storage_path text;
alter table public.media_library add column if not exists public_url text;
alter table public.media_library add column if not exists is_published boolean not null default false;
alter table public.media_library add column if not exists uploaded_by uuid references auth.users(id) on delete restrict;

-- Normalize category/status checks for the library sections.
alter table public.media_library drop constraint if exists media_library_category_check;
alter table public.media_library drop constraint if exists media_library_status_check;
alter table public.media_library add constraint media_library_category_check
  check (category in ('books','pictures','articles','mazameen','videos','charts','columns','lectures','audio','presentations','images','other'));
alter table public.media_library add constraint media_library_status_check
  check (status in ('draft','published'));

alter table public.media_library enable row level security;

drop policy if exists "Public can read published resources" on public.media_library;
create policy "Public can read published resources"
on public.media_library for select to anon, authenticated
using (status = 'published');

drop policy if exists "Admins can read all resources" on public.media_library;
create policy "Admins can read all resources"
on public.media_library for select to authenticated
using (exists (select 1 from public.user_roles ur where ur.user_id = auth.uid() and ur.role = 'admin'));

drop policy if exists "Admins can add resources" on public.media_library;
create policy "Admins can add resources"
on public.media_library for insert to authenticated
with check (
  created_by = auth.uid() and uploaded_by = auth.uid()
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

-- Public bucket: visitors can read files, but only verified admins can upload/change/delete.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'vetcare-library', 'vetcare-library', true, 104857600,
  array[
    'application/pdf',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg','image/png','image/webp','image/gif',
    'video/mp4','video/webm','video/quicktime','video/x-m4v',
    'audio/mpeg','audio/mp4','audio/wav','audio/x-wav','audio/ogg','audio/aac','audio/flac','audio/webm'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can read VetCare library files" on storage.objects;
create policy "Public can read VetCare library files"
on storage.objects for select to anon, authenticated
using (bucket_id = 'vetcare-library');

drop policy if exists "Admins can upload VetCare library files" on storage.objects;
create policy "Admins can upload VetCare library files"
on storage.objects for insert to authenticated
with check (bucket_id = 'vetcare-library' and exists (
  select 1 from public.user_roles ur where ur.user_id = auth.uid() and ur.role = 'admin'
));

drop policy if exists "Admins can update VetCare library files" on storage.objects;
create policy "Admins can update VetCare library files"
on storage.objects for update to authenticated
using (bucket_id = 'vetcare-library' and exists (
  select 1 from public.user_roles ur where ur.user_id = auth.uid() and ur.role = 'admin'
))
with check (bucket_id = 'vetcare-library' and exists (
  select 1 from public.user_roles ur where ur.user_id = auth.uid() and ur.role = 'admin'
));

drop policy if exists "Admins can delete VetCare library files" on storage.objects;
create policy "Admins can delete VetCare library files"
on storage.objects for delete to authenticated
using (bucket_id = 'vetcare-library' and exists (
  select 1 from public.user_roles ur where ur.user_id = auth.uid() and ur.role = 'admin'
));
