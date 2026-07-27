-- Track public AI crawler visits for GEO / AI Search monitoring.
-- This table must not store admin, API, shared document, customer, supplier, or ERP/CMS internal URLs.

create extension if not exists pgcrypto;

create table if not exists public.ai_crawler_visits (
  id uuid primary key default gen_random_uuid(),
  bot_name text not null,
  path text not null,
  user_agent text not null,
  referrer text,
  country text,
  created_at timestamptz not null default now()
);

alter table public.ai_crawler_visits enable row level security;

drop policy if exists "Public AI crawler insert only" on public.ai_crawler_visits;
drop policy if exists "Authenticated users can read AI crawler visits" on public.ai_crawler_visits;

create policy "Public AI crawler insert only"
on public.ai_crawler_visits
for insert
to anon, authenticated
with check (
  bot_name in (
    'GPTBot',
    'ChatGPT-User',
    'OAI-SearchBot',
    'ClaudeBot',
    'Claude-Web',
    'PerplexityBot',
    'anthropic-ai',
    'Google-Extended',
    'Googlebot',
    'GoogleOther',
    'Google-InspectionTool',
    'Google-CloudVertexBot',
    'Bingbot',
    'FacebookBot'
  )
  and path !~ '^/(admin|api|auth|doc)(/|$)'
  and path !~ '\.(js|css|png|jpg|jpeg|webp|avif|gif|svg|ico|woff|woff2|ttf|map)$'
  and char_length(path) <= 300
  and char_length(user_agent) <= 500
);

create policy "Authenticated users can read AI crawler visits"
on public.ai_crawler_visits
for select
to authenticated
using (true);

grant insert on table public.ai_crawler_visits to anon, authenticated;
grant select on table public.ai_crawler_visits to authenticated;

create index if not exists ai_crawler_visits_created_at_idx
on public.ai_crawler_visits (created_at desc);

create index if not exists ai_crawler_visits_bot_name_idx
on public.ai_crawler_visits (bot_name);

create index if not exists ai_crawler_visits_path_idx
on public.ai_crawler_visits (path);
