-- AI Citation & GEO Monitoring foundation.
-- Run this in Supabase SQL editor after ai-crawler-visits.sql.
-- This migration avoids storing admin/API/doc/customer-private URLs.

create extension if not exists pgcrypto;

alter table if exists public.ai_crawler_visits
  add column if not exists http_status integer,
  add column if not exists response_size integer,
  add column if not exists source text not null default 'next_proxy_request';

-- Crawler logs must be inserted by the server with SUPABASE_SERVICE_ROLE_KEY.
-- Remove the older public insert policy if it exists in production.
drop policy if exists "Public AI crawler insert only" on public.ai_crawler_visits;
revoke insert on table public.ai_crawler_visits from anon, authenticated;

create table if not exists public.ai_referral_visits (
  id uuid primary key default gen_random_uuid(),
  platform text not null,
  landing_page text not null,
  referrer text,
  user_agent text,
  created_at timestamptz not null default now()
);

alter table public.ai_referral_visits enable row level security;

drop policy if exists "Public AI referral insert only" on public.ai_referral_visits;
drop policy if exists "Authenticated users can read AI referrals" on public.ai_referral_visits;

create policy "Public AI referral insert only"
on public.ai_referral_visits
for insert
to anon, authenticated
with check (
  platform in (
    'chatgpt',
    'openai',
    'perplexity',
    'claude',
    'copilot',
    'gemini',
    'google_aio',
    'poe',
    'you',
    'phind',
    'unknown_ai'
  )
  and landing_page !~ '^/(admin|api|auth|doc|login)(/|$)'
  and landing_page !~ '\.(js|css|png|jpg|jpeg|webp|avif|gif|svg|ico|woff|woff2|ttf|map)$'
  and char_length(landing_page) <= 300
  and char_length(coalesce(referrer, '')) <= 500
  and char_length(coalesce(user_agent, '')) <= 500
);

create policy "Authenticated users can read AI referrals"
on public.ai_referral_visits
for select
to authenticated
using (true);

grant insert on table public.ai_referral_visits to anon, authenticated;
grant select on table public.ai_referral_visits to authenticated;

create index if not exists ai_referral_visits_created_at_idx
on public.ai_referral_visits (created_at desc);

create index if not exists ai_referral_visits_platform_idx
on public.ai_referral_visits (platform);

create index if not exists ai_referral_visits_landing_page_idx
on public.ai_referral_visits (landing_page);

create table if not exists public.ai_citation_prompts (
  id uuid primary key default gen_random_uuid(),
  prompt_text text not null,
  target_keyword text,
  platforms text[] not null default array['perplexity', 'gemini', 'google_aio'],
  active boolean not null default true,
  frequency text not null default 'weekly',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.ai_citation_prompts enable row level security;

drop policy if exists "Authenticated users can manage AI citation prompts" on public.ai_citation_prompts;

create policy "Authenticated users can manage AI citation prompts"
on public.ai_citation_prompts
for all
to authenticated
using (true)
with check (true);

grant select, insert, update, delete on table public.ai_citation_prompts to authenticated;

create index if not exists ai_citation_prompts_active_idx
on public.ai_citation_prompts (active);

create table if not exists public.ai_citation_logs (
  id uuid primary key default gen_random_uuid(),
  timestamp timestamptz not null default now(),
  platform text not null,
  prompt_text text not null,
  is_cited boolean not null default false,
  cited_urls jsonb not null default '[]'::jsonb,
  competitor_urls jsonb not null default '[]'::jsonb,
  brand_mentions jsonb not null default '[]'::jsonb,
  raw_response text,
  source text not null default 'manual_or_worker',
  prompt_id uuid references public.ai_citation_prompts(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.ai_citation_logs enable row level security;

drop policy if exists "Authenticated users can manage AI citation logs" on public.ai_citation_logs;

create policy "Authenticated users can manage AI citation logs"
on public.ai_citation_logs
for all
to authenticated
using (true)
with check (true);

grant select, insert, update, delete on table public.ai_citation_logs to authenticated;

create index if not exists ai_citation_logs_timestamp_idx
on public.ai_citation_logs (timestamp desc);

create index if not exists ai_citation_logs_platform_idx
on public.ai_citation_logs (platform);

create index if not exists ai_citation_logs_is_cited_idx
on public.ai_citation_logs (is_cited);
