-- Phase 11.2: Course Materials
-- Run this once in Supabase SQL Editor before using Instructor Portal > Course Materials.

create table if not exists public.course_materials (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null check (char_length(title) between 2 and 180),
  description text,
  material_type text not null check (material_type in ('file', 'link')),
  file_kind text not null default 'document' check (file_kind in ('pdf', 'image', 'document', 'link')),
  file_path text,
  file_name text,
  mime_type text,
  file_size bigint check (file_size is null or file_size >= 0),
  external_url text,
  is_published boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint course_material_payload_check check (
    (material_type = 'link' and external_url is not null and file_path is null)
    or
    (material_type = 'file' and file_path is not null and external_url is null)
  )
);

create index if not exists course_materials_course_idx
  on public.course_materials(course_id, is_published, created_at desc);

create or replace function public.set_course_material_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_course_materials_updated_at on public.course_materials;
create trigger trg_course_materials_updated_at
before update on public.course_materials
for each row execute function public.set_course_material_updated_at();

alter table public.course_materials enable row level security;

drop policy if exists "course materials student read" on public.course_materials;
create policy "course materials student read"
on public.course_materials
for select
to authenticated
using (
  is_published = true
  and exists (
    select 1
    from public.enrollments e
    join public.classes c on c.intake_id = e.intake_id
    where e.student_id = auth.uid()
      and e.status::text in ('active', 'paused', 'completed')
      and c.status <> 'cancelled'
      and c.course_id = course_materials.course_id
  )
);

drop policy if exists "course materials instructor read" on public.course_materials;
create policy "course materials instructor read"
on public.course_materials
for select
to authenticated
using (
  exists (
    select 1 from public.classes c
    where c.course_id = course_materials.course_id
      and c.instructor_id = auth.uid()
  )
  or exists (
    select 1 from public.user_roles ur
    where ur.user_id = auth.uid() and ur.role = 'super_admin'
  )
);

drop policy if exists "course materials instructor insert" on public.course_materials;
create policy "course materials instructor insert"
on public.course_materials
for insert
to authenticated
with check (
  exists (
    select 1 from public.classes c
    where c.course_id = course_materials.course_id
      and c.instructor_id = auth.uid()
  )
  or exists (
    select 1 from public.user_roles ur
    where ur.user_id = auth.uid() and ur.role = 'super_admin'
  )
);

drop policy if exists "course materials instructor update" on public.course_materials;
create policy "course materials instructor update"
on public.course_materials
for update
to authenticated
using (
  exists (
    select 1 from public.classes c
    where c.course_id = course_materials.course_id
      and c.instructor_id = auth.uid()
  )
  or exists (
    select 1 from public.user_roles ur
    where ur.user_id = auth.uid() and ur.role = 'super_admin'
  )
)
with check (
  exists (
    select 1 from public.classes c
    where c.course_id = course_materials.course_id
      and c.instructor_id = auth.uid()
  )
  or exists (
    select 1 from public.user_roles ur
    where ur.user_id = auth.uid() and ur.role = 'super_admin'
  )
);

drop policy if exists "course materials instructor delete" on public.course_materials;
create policy "course materials instructor delete"
on public.course_materials
for delete
to authenticated
using (
  exists (
    select 1 from public.classes c
    where c.course_id = course_materials.course_id
      and c.instructor_id = auth.uid()
  )
  or exists (
    select 1 from public.user_roles ur
    where ur.user_id = auth.uid() and ur.role = 'super_admin'
  )
);

grant select, insert, update, delete on public.course_materials to authenticated;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'course-materials',
  'course-materials',
  false,
  26214400,
  array[
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/webp',
    'image/gif',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'application/zip'
  ]::text[]
)
on conflict (id) do update set
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types,
  public = false;

-- The bucket stays private. App server actions use the service-role client for uploads
-- and generate short-lived signed URLs for authorized instructors/students.
