-- Stage 1. Apply atomically through the migration runner before deploying the app.
-- No existing account is enrolled automatically. No business policy changes here.
create schema if not exists private;
revoke all on schema private from public, anon;
revoke create on schema private from authenticated;
grant usage on schema private to authenticated;

create table public.admin_users (
  user_id uuid primary key references auth.users(id) on delete restrict,
  email text not null,
  role text not null check (role in ('owner', 'admin')),
  active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.admin_users enable row level security;
revoke all on table public.admin_users from public, anon, authenticated;
grant select on table public.admin_users to authenticated;
grant select, insert, update, delete on table public.admin_users to service_role;

-- This policy never calls is_admin(), so the lookup cannot recurse through RLS.
create policy "read own admin membership"
on public.admin_users for select to authenticated
using (user_id = (select auth.uid()));

create trigger admin_users_updated_at
before update on public.admin_users
for each row execute function public.update_updated_at();

-- SECURITY INVOKER uses the caller's own-row policy, not an RLS bypass.
create function private.is_admin()
returns boolean
language sql stable security invoker
set search_path = ''
as $$
  select auth.uid() is not null and exists (
    select 1 from public.admin_users
    where user_id = (select auth.uid())
      and active = true
      and role in ('owner', 'admin')
  );
$$;
revoke all on function private.is_admin() from public, anon, authenticated;
grant execute on function private.is_admin() to authenticated;

comment on table public.admin_users is
  'Admin membership is managed only through trusted database administration. Client accounts, including owners, cannot write membership.';
