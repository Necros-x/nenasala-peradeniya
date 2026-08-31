-- Phase 12.3 — self-managed profile avatars.
-- Run once in Supabase SQL Editor before enabling profile-photo uploads.
--
-- Profile photos are intentionally public-read because they are ordinary account avatars
-- rendered throughout the application. Upload/update/delete access is still restricted
-- to the authenticated user's fixed object path: <auth.uid()>/avatar.

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'profile-avatars',
  'profile-avatars',
  true,
  4194304,
  array[
    'image/jpeg',
    'image/png',
    'image/webp'
  ]::text[]
)
on conflict (id) do update set
  public = true,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "profile avatars select own metadata" on storage.objects;
create policy "profile avatars select own metadata"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'profile-avatars'
  and name = (select auth.uid())::text || '/avatar'
);

drop policy if exists "profile avatars insert own" on storage.objects;
create policy "profile avatars insert own"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'profile-avatars'
  and name = (select auth.uid())::text || '/avatar'
);

drop policy if exists "profile avatars update own" on storage.objects;
create policy "profile avatars update own"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'profile-avatars'
  and name = (select auth.uid())::text || '/avatar'
)
with check (
  bucket_id = 'profile-avatars'
  and name = (select auth.uid())::text || '/avatar'
);

drop policy if exists "profile avatars delete own" on storage.objects;
create policy "profile avatars delete own"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'profile-avatars'
  and name = (select auth.uid())::text || '/avatar'
);
