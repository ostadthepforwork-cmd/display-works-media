-- Track public AI crawler visits for GEO / AI Search monitoring.
-- This table must not store admin, API, shared document, customer, supplier, or ERP/CMS internal URLs.
-- Inserts are server-only via SUPABASE_SERVICE_ROLE_KEY in src/proxy.ts.

create extension if not exists pgcrypto;

create table if not exists public.ai_crawler_visits (
  id uuid primary key default gen_random_uuid(),
  bot_name text not null,
  path text not null,
  user_agent text not null,
  referrer text,
  country text,
  http_status integer,
  response_size integer,
  source text not null default 'next_proxy_request',
  created_at timestamptz not null default now()
);

alter table if exists public.ai_crawler_visits
  add column if not exists http_status integer,
  add column if not exists response_size integer,
  add column if not exists source text not null default 'next_proxy_request';

alter table public.ai_crawler_visits enable row level security;

drop policy if exists "Public AI crawler insert only" on public.ai_crawler_visits;
drop policy if exists "Authenticated users can read AI crawler visits" on public.ai_crawler_visits;

create policy "Authenticated users can read AI crawler visits"
on public.ai_crawler_visits
for select
to authenticated
using (true);

revoke insert on table public.ai_crawler_visits from anon, authenticated;
grant select on table public.ai_crawler_visits to authenticated;

create index if not exists ai_crawler_visits_created_at_idx
on public.ai_crawler_visits (created_at desc);

create index if not exists ai_crawler_visits_bot_name_idx
on public.ai_crawler_visits (bot_name);

create index if not exists ai_crawler_visits_path_idx
on public.ai_crawler_visits (path);
