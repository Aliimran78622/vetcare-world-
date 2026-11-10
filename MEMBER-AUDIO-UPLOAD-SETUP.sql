-- VetCare World: allow signed-in members to submit AUDIO lectures for Admin review.
-- Run in Supabase SQL Editor after the main Learning Library setup.

-- Ensure the bucket accepts the full set of supported library formats.
UPDATE storage.buckets
SET public = true,
    file_size_limit = 104857600,
    allowed_mime_types = ARRAY[
      'application/pdf',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg','image/png','image/webp','image/gif',
      'video/mp4','video/webm','video/quicktime','video/x-m4v',
      'audio/mpeg','audio/mp4','audio/wav','audio/x-wav','audio/ogg',
      'audio/aac','audio/x-aac','audio/flac','audio/webm','audio/x-m4a'
    ]
WHERE id = 'vetcare-library';

-- Members may insert only their own audio rows, initially as drafts.
DROP POLICY IF EXISTS "Members can submit audio lectures" ON public.media_library;
CREATE POLICY "Members can submit audio lectures"
ON public.media_library
FOR INSERT TO authenticated
WITH CHECK (
  category = 'audio'
  AND status = 'draft'
  AND is_published = false
  AND created_by = auth.uid()
  AND uploaded_by = auth.uid()
  AND file_path LIKE auth.uid()::text || '/%'
  AND storage_path LIKE auth.uid()::text || '/%'
);

-- Members can upload objects only into their own user-id folder.
-- Existing Admin policies remain in place and continue to allow Admin management.
DROP POLICY IF EXISTS "Members can upload audio to own folder" ON storage.objects;
CREATE POLICY "Members can upload audio to own folder"
ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'vetcare-library'
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND lower(storage.filename(name)) ~ '\.(mp3|m4a|wav|ogg|oga|aac|flac|weba)$'
);
