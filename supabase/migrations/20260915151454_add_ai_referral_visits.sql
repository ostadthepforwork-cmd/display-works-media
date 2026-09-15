-- Store verified AI-platform referral visits without exposing private application paths.
create table if not exists public.ai_referral_visits (
  id uuid primary key default gen_random_uuid(),
  platform text not null,
  landing_page text not null,
  referrer text,
  user_agent text,
  created_at timestamptz not null default now(),
  constraint ai_referral_visits_platform_check check (
    platform in ('chatgpt', 'openai', 'perplexity', 'claude', 'copilot', 'gemini', 'poe', 'you', 'phind')
  ),
  constraint ai_referral_visits_landing_page_check check (
    char_length(landing_page) between 1 and 300
    and landing_page !~* '^/(admin|api|auth|doc|login)(/|$)'
    and landing_page !~* '\.(js|css|png|jpg|jpeg|webp|avif|gif|svg|ico|woff|woff2|ttf|map)$'
  ),
  constraint ai_referral_visits_referrer_length_check check (char_length(coalesce(referrer, '')) <= 500),
  constraint ai_referral_visits_user_agent_length_check check (char_length(coalesce(user_agent, '')) <= 500)
);

alter table public.ai_referral_visits enable row level security;

drop policy if exists "Authenticated marketing users can read AI referrals" on public.ai_referral_visits;
create policy "Authenticated marketing users can read AI referrals"
on public.ai_referral_visits
for select
to authenticated
using (
  (select private.current_staff_role()) in ('owner', 'admin', 'sales', 'marketing')
);

revoke all on table public.ai_referral_visits from anon, authenticated;
grant select on table public.ai_referral_visits to authenticated;
grant all on table public.ai_referral_visits to service_role;

create index if not exists ai_referral_visits_created_at_idx
on public.ai_referral_visits (created_at desc);

create index if not exists ai_referral_visits_platform_created_at_idx
on public.ai_referral_visits (platform, created_at desc);

create index if not exists ai_referral_visits_landing_page_idx
on public.ai_referral_visits (landing_page);

comment on table public.ai_referral_visits is
  'Server-verified visits referred by known AI platforms. Private application paths are rejected.';
