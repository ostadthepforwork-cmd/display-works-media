-- Meta Ads -> CRM -> ERP attribution foundation.
-- Additive only: no existing ERP or marketing rows are rewritten by this migration.

begin;

create schema if not exists private;
revoke all on schema private from public, anon;
revoke create on schema private from authenticated;
grant usage on schema private to authenticated;

do $$
begin
  if to_regclass('public.admin_users') is null then
    raise exception 'public.admin_users is required before Meta CRM migration';
  end if;

  alter table public.admin_users drop constraint if exists admin_users_role_check;
  alter table public.admin_users
    add constraint admin_users_role_check
    check (role in ('owner', 'admin', 'sales', 'marketing'));
end;
$$;

create or replace function private.current_staff_role()
returns text
language sql stable security invoker
set search_path = ''
as $$
  select role
  from public.admin_users
  where user_id = (select auth.uid()) and active = true
  limit 1;
$$;
revoke all on function private.current_staff_role() from public, anon, authenticated;
grant execute on function private.current_staff_role() to authenticated;

create table public.crm_leads (
  lead_id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  customer_id uuid references public.erp_customers(id) on delete set null,
  source text not null default 'unattributed',
  source_detail text,
  campaign_id text,
  campaign_name text,
  adset_id text,
  adset_name text,
  ad_id text,
  ad_name text,
  creative_id text,
  conversation_id text,
  referral_id text,
  fbclid text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  product text,
  size_or_area text,
  quantity numeric,
  deadline_or_use_date date,
  artwork_status text,
  use_case text,
  installation_required boolean,
  location text,
  customer_type text,
  lead_status text not null default 'new',
  qualified_status text not null default 'unreviewed',
  qualification_method text,
  suggested_qualified boolean generated always as (
    nullif(btrim(product), '') is not null and (
      nullif(btrim(size_or_area), '') is not null
      or quantity is not null
      or deadline_or_use_date is not null
      or nullif(btrim(artwork_status), '') is not null
      or nullif(btrim(use_case), '') is not null
    )
  ) stored,
  qualified_at timestamptz,
  lost_reason text,
  estimated_value numeric(14,2),
  owner_id uuid references auth.users(id) on delete set null,
  next_follow_up_at timestamptz,
  attribution_method text not null default 'unattributed',
  attribution_confirmed_at timestamptz,
  attribution_confirmed_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  constraint crm_leads_quantity_check check (quantity is null or quantity >= 0),
  constraint crm_leads_estimated_value_check check (estimated_value is null or estimated_value >= 0),
  constraint crm_leads_status_check check (lead_status in (
    'new', 'contacted', 'waiting_detail', 'detail_completed', 'quotation_sent',
    'follow_up', 'waiting_payment', 'closed_won', 'closed_lost', 'not_qualified'
  )),
  constraint crm_leads_qualified_status_check check (qualified_status in ('unreviewed', 'qualified', 'not_qualified')),
  constraint crm_leads_qualification_method_check check (qualification_method is null or qualification_method = 'manual'),
  constraint crm_leads_manual_qualification_check check (
    (qualified_status = 'unreviewed' and qualification_method is null)
    or (qualified_status <> 'unreviewed' and qualification_method = 'manual')
  ),
  constraint crm_leads_lost_reason_check check (lost_reason is null or lost_reason in (
    'ghost', 'price', 'deadline', 'competitor', 'budget', 'scope_mismatch',
    'artwork_not_ready', 'cancelled', 'cannot_produce', 'no_response', 'unknown'
  )),
  constraint crm_leads_closed_lost_reason_check check (
    (lead_status = 'closed_lost' and lost_reason is not null)
    or (lead_status <> 'closed_lost' and lost_reason is null)
  ),
  constraint crm_leads_attribution_method_check check (attribution_method in ('automatic', 'manual', 'unattributed')),
  constraint crm_leads_manual_attribution_check check (
    attribution_method <> 'manual'
    or (attribution_confirmed_at is not null and attribution_confirmed_by is not null)
  )
);

create unique index crm_leads_conversation_id_uidx
on public.crm_leads (conversation_id)
where conversation_id is not null;
create index crm_leads_created_at_idx on public.crm_leads (created_at desc);
create index crm_leads_owner_follow_up_idx on public.crm_leads (owner_id, next_follow_up_at);
create index crm_leads_ad_id_idx on public.crm_leads (ad_id) where ad_id is not null;

create table public.crm_lead_document_mappings (
  mapping_id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.crm_leads(lead_id) on delete restrict,
  quote_id uuid references public.erp_documents(id) on delete restrict,
  receipt_id uuid references public.erp_documents(id) on delete restrict,
  mapping_method text not null,
  mapping_confidence numeric(4,3),
  mapping_evidence jsonb not null default '{}'::jsonb,
  mapped_at timestamptz not null default now(),
  mapped_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  constraint crm_mapping_method_check check (mapping_method in ('automatic', 'manual', 'imported', 'unattributed')),
  constraint crm_mapping_confidence_check check (mapping_confidence is null or (mapping_confidence >= 0 and mapping_confidence <= 1)),
  constraint crm_mapping_target_check check (quote_id is not null or receipt_id is not null),
  constraint crm_mapping_unattributed_check check (
    (mapping_method = 'unattributed' and lead_id is null)
    or (mapping_method <> 'unattributed' and lead_id is not null)
  ),
  constraint crm_mapping_manual_actor_check check (mapping_method <> 'manual' or mapped_by is not null)
);
create unique index crm_mapping_quote_uidx on public.crm_lead_document_mappings (quote_id) where quote_id is not null;
create unique index crm_mapping_receipt_uidx on public.crm_lead_document_mappings (receipt_id) where receipt_id is not null;
create index crm_mapping_lead_idx on public.crm_lead_document_mappings (lead_id, mapped_at desc);

create table public.crm_lead_audit_events (
  event_id bigint generated always as identity primary key,
  lead_id uuid references public.crm_leads(lead_id) on delete restrict,
  mapping_id uuid references public.crm_lead_document_mappings(mapping_id) on delete restrict,
  event_type text not null check (event_type in ('attribution_changed', 'qualification_changed', 'lost_reason_changed', 'mapping_created', 'mapping_changed')),
  old_value jsonb,
  new_value jsonb,
  actor_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index crm_lead_audit_events_lead_idx on public.crm_lead_audit_events (lead_id, created_at desc);

create table public.marketing_meta_entities (
  entity_type text not null check (entity_type in ('campaign', 'adset', 'ad', 'creative')),
  entity_id text not null,
  entity_name text not null,
  campaign_id text,
  campaign_name text,
  adset_id text,
  adset_name text,
  synced_at timestamptz not null default now(),
  primary key (entity_type, entity_id)
);
create index marketing_meta_entities_campaign_idx on public.marketing_meta_entities (campaign_id, entity_type);

create table public.marketing_campaign_budgets (
  campaign_id text primary key,
  daily_budget numeric(14,2),
  lifetime_budget numeric(14,2),
  start_date date,
  end_date date,
  currency text not null default 'THB',
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null,
  constraint marketing_campaign_budget_amount_check check (
    (daily_budget is null or daily_budget >= 0) and (lifetime_budget is null or lifetime_budget >= 0)
  ),
  constraint marketing_campaign_budget_dates_check check (end_date is null or start_date is null or end_date >= start_date),
  constraint marketing_campaign_budget_currency_check check (currency ~ '^[A-Z]{3}$')
);

create table public.marketing_messenger_referrals (
  referral_event_id uuid primary key default gen_random_uuid(),
  event_reference text not null unique,
  conversation_id text not null,
  referral_id text,
  campaign_id text,
  adset_id text,
  ad_id text,
  occurred_at timestamptz not null,
  received_at timestamptz not null default now(),
  lead_id uuid not null references public.crm_leads(lead_id) on delete restrict,
  raw_metadata jsonb not null default '{}'::jsonb,
  constraint messenger_metadata_no_message_check check (
    not (raw_metadata ? 'message') and not (raw_metadata ? 'text') and not (raw_metadata ? 'attachments')
  )
);
create index marketing_messenger_referrals_conversation_idx on public.marketing_messenger_referrals (conversation_id, occurred_at desc);

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
  source text,
  prompt_id uuid
);

create or replace function private.crm_set_updated_at()
returns trigger language plpgsql security invoker set search_path = ''
as $$ begin new.updated_at := now(); return new; end $$;
revoke all on function private.crm_set_updated_at() from public, anon, authenticated;

create trigger crm_leads_set_updated_at before update on public.crm_leads
for each row execute function private.crm_set_updated_at();
create trigger crm_mapping_set_updated_at before update on public.crm_lead_document_mappings
for each row execute function private.crm_set_updated_at();
create trigger marketing_campaign_budgets_set_updated_at before update on public.marketing_campaign_budgets
for each row execute function private.crm_set_updated_at();

create or replace function private.crm_protect_identity_and_manual_state()
returns trigger language plpgsql security invoker set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' and new.lead_id <> old.lead_id then
    raise exception 'lead_id is immutable';
  end if;

  if tg_op = 'UPDATE' and old.qualification_method = 'manual'
     and new.qualification_method is distinct from 'manual' then
    raise exception 'manual qualification cannot be overwritten by an automatic suggestion';
  end if;

  if new.qualified_status = 'qualified' and (tg_op = 'INSERT' or new.qualified_status is distinct from old.qualified_status) then
    new.qualified_at := coalesce(new.qualified_at, now());
  elsif new.qualified_status <> 'qualified' then
    new.qualified_at := null;
  end if;

  if new.lead_status = 'closed_won' and not exists (
    select 1
    from public.crm_lead_document_mappings mapping
    where mapping.lead_id = new.lead_id and mapping.receipt_id is not null
  ) then
    raise exception 'Closed Won requires a receipt mapping';
  end if;
  return new;
end;
$$;
revoke all on function private.crm_protect_identity_and_manual_state() from public, anon, authenticated;
create trigger crm_leads_protect_identity before insert or update on public.crm_leads
for each row execute function private.crm_protect_identity_and_manual_state();

create or replace function private.crm_validate_document_mapping()
returns trigger language plpgsql security invoker set search_path = ''
as $$
begin
  if new.quote_id is not null and not exists (
    select 1 from public.erp_documents where id = new.quote_id and type = 'quote' and coalesce(deleted, false) = false
  ) then
    raise exception 'quote_id must reference an active quote';
  end if;
  if new.receipt_id is not null and not exists (
    select 1 from public.erp_documents where id = new.receipt_id and type = 'receipt' and coalesce(deleted, false) = false
  ) then
    raise exception 'receipt_id must reference an active receipt';
  end if;
  if new.mapping_method = 'automatic' and not exists (
    select 1 from public.crm_leads l where l.lead_id = new.lead_id and (
      l.ad_id is not null or l.referral_id is not null or l.fbclid is not null
      or l.utm_source is not null or l.utm_campaign is not null
    )
  ) then
    raise exception 'automatic mapping requires explicit attribution evidence';
  end if;
  return new;
end;
$$;
revoke all on function private.crm_validate_document_mapping() from public, anon, authenticated;
create trigger crm_validate_document_mapping before insert or update on public.crm_lead_document_mappings
for each row execute function private.crm_validate_document_mapping();

create or replace function private.crm_audit_lead_change()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if row(new.campaign_id, new.adset_id, new.ad_id, new.referral_id, new.fbclid, new.utm_source, new.attribution_method)
     is distinct from row(old.campaign_id, old.adset_id, old.ad_id, old.referral_id, old.fbclid, old.utm_source, old.attribution_method) then
    insert into public.crm_lead_audit_events(lead_id, event_type, old_value, new_value, actor_id)
    values (new.lead_id, 'attribution_changed',
      jsonb_build_object('campaign_id', old.campaign_id, 'adset_id', old.adset_id, 'ad_id', old.ad_id, 'method', old.attribution_method),
      jsonb_build_object('campaign_id', new.campaign_id, 'adset_id', new.adset_id, 'ad_id', new.ad_id, 'method', new.attribution_method), auth.uid());
  end if;
  if row(new.qualified_status, new.qualification_method) is distinct from row(old.qualified_status, old.qualification_method) then
    insert into public.crm_lead_audit_events(lead_id, event_type, old_value, new_value, actor_id)
    values (new.lead_id, 'qualification_changed', to_jsonb(old.qualified_status), to_jsonb(new.qualified_status), auth.uid());
  end if;
  if new.lost_reason is distinct from old.lost_reason then
    insert into public.crm_lead_audit_events(lead_id, event_type, old_value, new_value, actor_id)
    values (new.lead_id, 'lost_reason_changed', to_jsonb(old.lost_reason), to_jsonb(new.lost_reason), auth.uid());
  end if;
  return new;
end;
$$;
revoke all on function private.crm_audit_lead_change() from public, anon, authenticated;
create trigger crm_audit_lead_change after update on public.crm_leads
for each row execute function private.crm_audit_lead_change();

create or replace function private.crm_audit_mapping_change()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.crm_lead_audit_events(lead_id, mapping_id, event_type, old_value, new_value, actor_id)
  values (new.lead_id, new.mapping_id,
    case when tg_op = 'INSERT' then 'mapping_created' else 'mapping_changed' end,
    case when tg_op = 'INSERT' then null else to_jsonb(old) end,
    to_jsonb(new), auth.uid());
  return new;
end;
$$;
revoke all on function private.crm_audit_mapping_change() from public, anon, authenticated;
create trigger crm_audit_mapping_change after insert or update on public.crm_lead_document_mappings
for each row execute function private.crm_audit_mapping_change();

create or replace function private.validate_campaign_budget()
returns trigger language plpgsql security invoker set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.marketing_meta_entities
    where entity_type = 'campaign' and entity_id = new.campaign_id
  ) then
    raise exception 'campaign_id must exist in the latest Meta sync';
  end if;
  return new;
end;
$$;
revoke all on function private.validate_campaign_budget() from public, anon, authenticated;
create trigger validate_campaign_budget before insert or update on public.marketing_campaign_budgets
for each row execute function private.validate_campaign_budget();

alter table public.crm_leads enable row level security;
alter table public.crm_lead_document_mappings enable row level security;
alter table public.crm_lead_audit_events enable row level security;
alter table public.marketing_meta_entities enable row level security;
alter table public.marketing_campaign_budgets enable row level security;
alter table public.marketing_messenger_referrals enable row level security;
alter table public.ai_citation_logs enable row level security;

drop policy if exists "Authenticated users can manage AI citation logs" on public.ai_citation_logs;
drop policy if exists "active admins manage AI citation logs" on public.ai_citation_logs;

revoke all on public.crm_leads, public.crm_lead_document_mappings, public.crm_lead_audit_events,
  public.marketing_meta_entities, public.marketing_campaign_budgets,
  public.marketing_messenger_referrals, public.ai_citation_logs from public, anon, authenticated;
grant select, insert, update on public.crm_leads to authenticated;
grant select, insert, update on public.crm_lead_document_mappings to authenticated;
grant select on public.crm_lead_audit_events to authenticated;
grant select, insert, update on public.marketing_meta_entities to authenticated;
grant select, insert, update, delete on public.marketing_campaign_budgets to authenticated;
grant select on public.marketing_messenger_referrals to authenticated;
grant select on public.ai_citation_logs to authenticated;
grant all on public.crm_leads, public.crm_lead_document_mappings, public.crm_lead_audit_events,
  public.marketing_meta_entities, public.marketing_campaign_budgets,
  public.marketing_messenger_referrals, public.ai_citation_logs to service_role;
grant usage, select on sequence public.crm_lead_audit_events_event_id_seq to service_role;

create policy "staff read CRM leads" on public.crm_leads for select to authenticated
using ((select private.current_staff_role()) in ('owner', 'admin', 'sales', 'marketing'));
create policy "sales manage CRM leads" on public.crm_leads for insert to authenticated
with check ((select private.current_staff_role()) in ('owner', 'admin', 'sales'));
create policy "sales update CRM leads" on public.crm_leads for update to authenticated
using ((select private.current_staff_role()) in ('owner', 'admin', 'sales'))
with check ((select private.current_staff_role()) in ('owner', 'admin', 'sales'));

create policy "staff read CRM mappings" on public.crm_lead_document_mappings for select to authenticated
using ((select private.current_staff_role()) in ('owner', 'admin', 'sales', 'marketing'));
create policy "sales create CRM mappings" on public.crm_lead_document_mappings for insert to authenticated
with check ((select private.current_staff_role()) in ('owner', 'admin', 'sales'));
create policy "sales update CRM mappings" on public.crm_lead_document_mappings for update to authenticated
using ((select private.current_staff_role()) in ('owner', 'admin', 'sales'))
with check ((select private.current_staff_role()) in ('owner', 'admin', 'sales'));

create policy "staff read CRM audit" on public.crm_lead_audit_events for select to authenticated
using ((select private.current_staff_role()) in ('owner', 'admin', 'sales', 'marketing'));

create policy "staff read Meta entities" on public.marketing_meta_entities for select to authenticated
using ((select private.current_staff_role()) in ('owner', 'admin', 'sales', 'marketing'));
create policy "marketing sync Meta entities" on public.marketing_meta_entities for insert to authenticated
with check ((select private.current_staff_role()) in ('owner', 'admin', 'marketing'));
create policy "marketing update Meta entities" on public.marketing_meta_entities for update to authenticated
using ((select private.current_staff_role()) in ('owner', 'admin', 'marketing'))
with check ((select private.current_staff_role()) in ('owner', 'admin', 'marketing'));

create policy "staff read campaign budgets" on public.marketing_campaign_budgets for select to authenticated
using ((select private.current_staff_role()) in ('owner', 'admin', 'sales', 'marketing'));
create policy "marketing insert campaign budgets" on public.marketing_campaign_budgets for insert to authenticated
with check ((select private.current_staff_role()) in ('owner', 'admin', 'marketing'));
create policy "marketing update campaign budgets" on public.marketing_campaign_budgets for update to authenticated
using ((select private.current_staff_role()) in ('owner', 'admin', 'marketing'))
with check ((select private.current_staff_role()) in ('owner', 'admin', 'marketing'));
create policy "admins delete campaign budgets" on public.marketing_campaign_budgets for delete to authenticated
using ((select private.current_staff_role()) in ('owner', 'admin'));

create policy "staff read Messenger referral metadata" on public.marketing_messenger_referrals for select to authenticated
using ((select private.current_staff_role()) in ('owner', 'admin', 'sales', 'marketing'));
create policy "staff read AI citation logs" on public.ai_citation_logs for select to authenticated
using ((select private.current_staff_role()) in ('owner', 'admin', 'sales', 'marketing'));

create or replace function public.save_crm_document_mapping_v1(
  p_lead_id uuid,
  p_quote_id uuid,
  p_receipt_id uuid,
  p_mapping_method text,
  p_mapping_confidence numeric default null,
  p_mapping_evidence jsonb default '{}'::jsonb,
  p_mark_won boolean default false
)
returns public.crm_lead_document_mappings
language plpgsql security invoker
set search_path = ''
as $$
declare
  result public.crm_lead_document_mappings;
begin
  if (select private.current_staff_role()) not in ('owner', 'admin', 'sales') then
    raise exception 'forbidden';
  end if;

  insert into public.crm_lead_document_mappings(
    lead_id, quote_id, receipt_id, mapping_method, mapping_confidence, mapping_evidence, mapped_by
  ) values (
    p_lead_id, p_quote_id, p_receipt_id, p_mapping_method, p_mapping_confidence,
    coalesce(p_mapping_evidence, '{}'::jsonb), auth.uid()
  )
  on conflict (receipt_id) where receipt_id is not null do update set
    lead_id = excluded.lead_id,
    quote_id = coalesce(excluded.quote_id, public.crm_lead_document_mappings.quote_id),
    mapping_method = excluded.mapping_method,
    mapping_confidence = excluded.mapping_confidence,
    mapping_evidence = excluded.mapping_evidence,
    mapped_by = auth.uid()
  returning * into result;

  if p_mark_won then
    if p_receipt_id is null then raise exception 'Closed Won requires a receipt mapping'; end if;
    update public.crm_leads set lead_status = 'closed_won' where lead_id = p_lead_id;
  end if;
  return result;
end;
$$;
revoke all on function public.save_crm_document_mapping_v1(uuid, uuid, uuid, text, numeric, jsonb, boolean) from public, anon;
grant execute on function public.save_crm_document_mapping_v1(uuid, uuid, uuid, text, numeric, jsonb, boolean) to authenticated, service_role;

comment on table public.crm_leads is 'CRM operational fields and evidence-based attribution. Contains no customer name, phone, address, or chat body.';
comment on column public.crm_leads.estimated_value is 'Pipeline estimate only. Never counted as ERP revenue.';
comment on table public.crm_lead_document_mappings is 'Auditable lead -> quote -> receipt links. ERP receipt remains the only revenue source.';
comment on table public.marketing_messenger_referrals is 'Minimal Messenger referral metadata; raw message bodies are prohibited.';

-- Campaign 120249760412250073 / THB 200 daily is intentionally not inserted here.
-- The validation trigger permits it only after the campaign exists in marketing_meta_entities.

commit;
