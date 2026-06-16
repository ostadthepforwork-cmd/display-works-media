-- CMS settings storage for website text, hero, services, reviews, portfolio, and contact content.
-- Run this in the Supabase SQL editor if CMS edits do not persist after logout/login.

create table if not exists public.cms_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.cms_settings enable row level security;

drop policy if exists "cms_settings public read" on public.cms_settings;
create policy "cms_settings public read"
on public.cms_settings
for select
to anon, authenticated
using (true);

drop policy if exists "cms_settings authenticated insert" on public.cms_settings;
create policy "cms_settings authenticated insert"
on public.cms_settings
for insert
to authenticated
with check (true);

drop policy if exists "cms_settings authenticated update" on public.cms_settings;
create policy "cms_settings authenticated update"
on public.cms_settings
for update
to authenticated
using (true)
with check (true);

drop policy if exists "cms_settings authenticated delete" on public.cms_settings;
create policy "cms_settings authenticated delete"
on public.cms_settings
for delete
to authenticated
using (true);
