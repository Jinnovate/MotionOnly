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
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

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

alter table public.motion_profiles enable row level security;
alter table public.motion_invites enable row level security;
alter table public.motion_today_motions enable row level security;
alter table public.motion_goals enable row level security;
alter table public.motion_daily_standards enable row level security;
alter table public.motion_daily_notes enable row level security;

drop policy if exists "members can read own profile" on public.motion_profiles;
create policy "members can read own profile"
on public.motion_profiles for select
to authenticated
using (id = auth.uid());

drop policy if exists "members can create own profile" on public.motion_profiles;
create policy "members can create own profile"
on public.motion_profiles for insert
to authenticated
with check (id = auth.uid());

drop policy if exists "members can update own profile" on public.motion_profiles;
create policy "members can update own profile"
on public.motion_profiles for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

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
