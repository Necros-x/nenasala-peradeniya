-- Phase 12.1 — platform settings + contact inbox.
-- Applied to Supabase production on 2026-08-31.

create table if not exists public.platform_settings (
  id smallint primary key default 1 check (id = 1),
  institution_name text not null default 'Nenasala Peradeniya' check (char_length(institution_name) between 2 and 120),
  support_email text,
  support_phone text,
  address text,
  contact_notification_email text,
  contact_form_enabled boolean not null default true,
  contact_auto_reply_enabled boolean not null default true,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.platform_settings (id)
values (1)
on conflict (id) do nothing;

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  email text not null check (char_length(email) between 3 and 320),
  phone text check (phone is null or char_length(phone) <= 40),
  category text not null default 'general' check (category in ('general','course','enrollment','technical','certificate','other')),
  subject text not null check (char_length(subject) between 2 and 180),
  message text not null check (char_length(message) between 5 and 10000),
  status text not null default 'new' check (status in ('new','read','replied','closed')),
  admin_notes text check (admin_notes is null or char_length(admin_notes) <= 5000),
  last_replied_at timestamptz,
  last_replied_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.contact_message_replies (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.contact_messages(id) on delete cascade,
  sender_id uuid references public.profiles(id) on delete set null,
  body text not null check (char_length(body) between 1 and 10000),
  resend_email_id text,
  delivery_status text not null default 'sent' check (delivery_status in ('sent','failed')),
  created_at timestamptz not null default now()
);

create index if not exists contact_messages_status_created_idx on public.contact_messages(status, created_at desc);
create index if not exists contact_messages_category_created_idx on public.contact_messages(category, created_at desc);
create index if not exists contact_messages_email_created_idx on public.contact_messages(lower(email), created_at desc);
create index if not exists contact_message_replies_message_created_idx on public.contact_message_replies(message_id, created_at asc);

create index if not exists contact_message_replies_sender_idx
  on public.contact_message_replies(sender_id);

create index if not exists contact_messages_last_replied_by_idx
  on public.contact_messages(last_replied_by);

create index if not exists platform_settings_updated_by_idx
  on public.platform_settings(updated_by);

create or replace function private.is_administration_actor()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role in ('staff'::public.app_role, 'admin'::public.app_role, 'super_admin'::public.app_role)
  );
$$;

revoke all on function private.is_administration_actor() from public;
grant execute on function private.is_administration_actor() to authenticated;

alter table public.platform_settings enable row level security;
alter table public.contact_messages enable row level security;
alter table public.contact_message_replies enable row level security;

create policy platform_settings_read
on public.platform_settings for select to authenticated
using (private.is_administration_actor());

create or replace function private.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role = 'super_admin'::public.app_role
  );
$$;

revoke all on function private.is_super_admin() from public;
grant execute on function private.is_super_admin() to authenticated;

create policy contact_messages_admin_read
on public.contact_messages for select to authenticated
using (private.is_administration_actor());

create policy contact_message_replies_admin_read
on public.contact_message_replies for select to authenticated
using (private.is_administration_actor());

-- All writes to these three tables intentionally go through guarded server actions
-- using the Supabase service role. No authenticated INSERT/UPDATE policies are created.

comment on table public.platform_settings is
  'Phase 12.1 singleton platform configuration. Administration actors may read; writes are server-only.';
comment on table public.contact_messages is
  'Website contact inbox. Administration actors may read; creation and updates are server-only.';
comment on table public.contact_message_replies is
  'Stored outbound contact replies. Administration actors may read; inserts are server-only.';

create trigger platform_settings_set_updated_at
before update on public.platform_settings
for each row execute function public.set_updated_at();

create trigger contact_messages_set_updated_at
before update on public.contact_messages
for each row execute function public.set_updated_at();
