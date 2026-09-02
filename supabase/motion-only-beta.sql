-- Motion Only private beta account setup for Supabase.
-- Run this once in the Supabase SQL editor.

create extension if not exists pgcrypto;

do $$ begin
  create type public.motion_role as enum ('member', 'moderator', 'admin');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.motion_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text not null,
  role public.motion_role not null default 'member',
  founding_role text not null default 'none',
  founding_status boolean not null default false,
  founding_notes text not null default '',
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.motion_profiles add column if not exists founding_role text not null default 'none';
alter table public.motion_profiles add column if not exists founding_status boolean not null default false;
alter table public.motion_profiles add column if not exists founding_notes text not null default '';

create table if not exists public.motion_invites (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  email text not null,
  role public.motion_role not null default 'member',
  created_by uuid references auth.users(id),
  accepted_by uuid references auth.users(id),
  accepted_at timestamptz,
  expires_at timestamptz not null default now() + interval '14 days',
  created_at timestamptz not null default now()
);

create table if not exists public.motion_today_motions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  category text not null default 'Business',
  scheduled_date date not null default current_date,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.motion_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  category text not null default 'BUSINESS',
  today_action text not null default 'Choose one action for today',
  evidence_count integer not null default 0,
  exp integer not null default 0,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.motion_daily_standards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  category text not null default 'Lifestyle',
  completed_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.motion_daily_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  note_date date not null default current_date,
  note text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, note_date)
);

create table if not exists public.motion_rooms (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  kind text not null default 'network',
  room_type text not null default 'Topic discussion',
  access text not null default 'All members',
  posting_rules text not null default 'Members can post. Keep it useful, specific and respectful.',
  moderation text not null default 'Report queue enabled',
  created_by uuid references auth.users(id),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.motion_room_messages (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.motion_rooms(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  author_name text not null default 'Motion Only member',
  author_founding_role text not null default '',
  body text not null,
  exp_awarded integer not null default 0,
  quality_label text not null default 'No EXP',
  quality_reason text not null default '',
  pinned_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.motion_room_messages add column if not exists author_founding_role text not null default '';

create unique index if not exists motion_rooms_kind_title_key on public.motion_rooms (kind, lower(title));

alter table public.motion_profiles enable row level security;
alter table public.motion_invites enable row level security;
alter table public.motion_today_motions enable row level security;
alter table public.motion_goals enable row level security;
alter table public.motion_daily_standards enable row level security;
alter table public.motion_daily_notes enable row level security;
alter table public.motion_rooms enable row level security;
alter table public.motion_room_messages enable row level security;

create or replace function public.current_motion_role()
returns public.motion_role
language sql
security definer
set search_path = public
stable
as $$
  select role from public.motion_profiles where id = auth.uid();
$$;

grant execute on function public.current_motion_role() to authenticated;

drop policy if exists "members can read own profile" on public.motion_profiles;
create policy "members can read own profile"
on public.motion_profiles for select
to authenticated
using (id = auth.uid());

drop policy if exists "admins can read all profiles" on public.motion_profiles;
create policy "admins can read all profiles"
on public.motion_profiles for select
to authenticated
using (public.current_motion_role() in ('admin', 'moderator'));

drop policy if exists "members can create own profile" on public.motion_profiles;
create policy "members can create own profile"
on public.motion_profiles for insert
to authenticated
with check (id = auth.uid());

drop policy if exists "members can update own profile" on public.motion_profiles;

drop policy if exists "admins can update profile roles" on public.motion_profiles;
create policy "admins can update profile roles"
on public.motion_profiles for update
to authenticated
using (public.current_motion_role() = 'admin')
with check (public.current_motion_role() = 'admin');

drop policy if exists "admins can manage invites" on public.motion_invites;
create policy "admins can manage invites"
on public.motion_invites for all
to authenticated
using (
  exists (
    select 1 from public.motion_profiles
    where id = auth.uid() and role = 'admin'
  )
)
with check (
  exists (
    select 1 from public.motion_profiles
    where id = auth.uid() and role = 'admin'
  )
);

drop policy if exists "members manage own today motions" on public.motion_today_motions;
create policy "members manage own today motions"
on public.motion_today_motions for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "members manage own goals" on public.motion_goals;
create policy "members manage own goals"
on public.motion_goals for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "members manage own daily standards" on public.motion_daily_standards;
create policy "members manage own daily standards"
on public.motion_daily_standards for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "members manage own daily notes" on public.motion_daily_notes;
create policy "members manage own daily notes"
on public.motion_daily_notes for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "members can read active network rooms" on public.motion_rooms;
create policy "members can read active network rooms"
on public.motion_rooms for select
to authenticated
using (
  archived_at is null
  and (
    access = 'All members'
    or created_by = auth.uid()
    or exists (
      select 1 from public.motion_profiles
      where id = auth.uid() and role in ('admin', 'moderator')
    )
  )
);

drop policy if exists "members can create network rooms" on public.motion_rooms;
create policy "members can create network rooms"
on public.motion_rooms for insert
to authenticated
with check (
  created_by = auth.uid()
  and kind in ('network', 'direct')
);

drop policy if exists "admins can update rooms" on public.motion_rooms;
create policy "admins can update rooms"
on public.motion_rooms for update
to authenticated
using (
  created_by = auth.uid()
  or exists (
    select 1 from public.motion_profiles
    where id = auth.uid() and role in ('admin', 'moderator')
  )
)
with check (
  created_by = auth.uid()
  or exists (
    select 1 from public.motion_profiles
    where id = auth.uid() and role in ('admin', 'moderator')
  )
);

drop policy if exists "members can read room messages" on public.motion_room_messages;
create policy "members can read room messages"
on public.motion_room_messages for select
to authenticated
using (
  deleted_at is null
  and exists (
    select 1 from public.motion_rooms r
    where r.id = room_id
      and r.archived_at is null
      and (
        r.access = 'All members'
        or r.created_by = auth.uid()
        or author_id = auth.uid()
        or exists (
          select 1 from public.motion_profiles
          where id = auth.uid() and role in ('admin', 'moderator')
        )
      )
  )
);

drop policy if exists "members can post room messages" on public.motion_room_messages;
create policy "members can post room messages"
on public.motion_room_messages for insert
to authenticated
with check (
  author_id = auth.uid()
  and exists (
    select 1 from public.motion_rooms r
    where r.id = room_id
      and r.archived_at is null
      and (
        r.access = 'All members'
        or r.created_by = auth.uid()
        or exists (
          select 1 from public.motion_profiles
          where id = auth.uid() and role in ('admin', 'moderator')
        )
      )
  )
);

drop policy if exists "authors and moderators can update messages" on public.motion_room_messages;
create policy "authors and moderators can update messages"
on public.motion_room_messages for update
to authenticated
using (
  author_id = auth.uid()
  or exists (
    select 1 from public.motion_profiles
    where id = auth.uid() and role in ('admin', 'moderator')
  )
)
with check (
  author_id = auth.uid()
  or exists (
    select 1 from public.motion_profiles
    where id = auth.uid() and role in ('admin', 'moderator')
  )
);

insert into public.motion_rooms (title, description, kind, room_type, access, posting_rules, moderation)
values
  ('The Trading Room', 'Discuss trading discipline, market preparation, journaling and educational setup reviews. No live buy-now or sell-now pressure.', 'network', 'Topic discussion', 'All members', 'Educational context only. No guaranteed returns, pressure, or live instructions.', 'Report queue enabled'),
  ('Hook Line & Posted', 'Share content ideas, posts that need useful support, hook feedback, comment strategy and what is working across social media.', 'network', 'Social support', 'All members', 'Ask clearly for the support you need. No spam, engagement bait, fake claims or referral pressure.', 'Report queue enabled'),
  ('Business Moves', 'For outreach, offers, sales pipelines, follow-ups and practical business execution.', 'network', 'Accountability room', 'All members', 'Post useful context, results, questions and next steps.', 'Report queue enabled')
on conflict do nothing;

do $$ begin
  alter publication supabase_realtime add table public.motion_room_messages;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;

create or replace function public.claim_motion_invite(invite_code text, invite_email text)
returns table(role public.motion_role, email text)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select i.role, i.email
  from public.motion_invites i
  where i.code = invite_code
    and lower(i.email) = lower(invite_email)
    and i.accepted_at is null
    and i.expires_at > now()
  limit 1;
end;
$$;

create or replace function public.mark_motion_invite_accepted(invite_code text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.motion_invites
  set accepted_at = now(),
      accepted_by = auth.uid()
  where code = invite_code
    and accepted_at is null
    and expires_at > now();
end;
$$;

grant execute on function public.claim_motion_invite(text, text) to anon, authenticated;
grant execute on function public.mark_motion_invite_accepted(text) to authenticated;

-- After creating your own account, run this with your email to make yourself admin:
-- update public.motion_profiles set role = 'admin' where lower(email) = lower('YOUR_EMAIL_HERE');

-- To create a test invite manually:
-- insert into public.motion_invites (code, email, role)
-- values ('MO-TEST-001', 'tester@example.com', 'member');
