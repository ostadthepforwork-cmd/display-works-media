-- Data-preserving rollback. Run only after the application has been rolled back.
-- Tables are moved out of the Data API instead of being dropped.
begin;

drop function if exists public.save_crm_document_mapping_v1(uuid, uuid, uuid, text, numeric, jsonb, boolean);

drop trigger if exists validate_campaign_budget on public.marketing_campaign_budgets;
drop trigger if exists crm_audit_mapping_change on public.crm_lead_document_mappings;
drop trigger if exists crm_audit_lead_change on public.crm_leads;
drop trigger if exists crm_validate_document_mapping on public.crm_lead_document_mappings;
drop trigger if exists crm_leads_protect_identity on public.crm_leads;
drop trigger if exists marketing_campaign_budgets_set_updated_at on public.marketing_campaign_budgets;
drop trigger if exists crm_mapping_set_updated_at on public.crm_lead_document_mappings;
drop trigger if exists crm_leads_set_updated_at on public.crm_leads;

drop function if exists private.validate_campaign_budget();
drop function if exists private.crm_audit_mapping_change();
drop function if exists private.crm_audit_lead_change();
drop function if exists private.crm_validate_document_mapping();
drop function if exists private.crm_protect_identity_and_manual_state();
drop function if exists private.crm_set_updated_at();

revoke all on public.crm_leads, public.crm_lead_document_mappings, public.crm_lead_audit_events,
  public.marketing_meta_entities, public.marketing_campaign_budgets,
  public.marketing_messenger_referrals from public, anon, authenticated;

alter table public.crm_leads rename to crm_leads_rollback_20260915;
alter table public.crm_lead_document_mappings rename to crm_lead_document_mappings_rollback_20260915;
alter table public.crm_lead_audit_events rename to crm_lead_audit_events_rollback_20260915;
alter table public.marketing_meta_entities rename to marketing_meta_entities_rollback_20260915;
alter table public.marketing_campaign_budgets rename to marketing_campaign_budgets_rollback_20260915;
alter table public.marketing_messenger_referrals rename to marketing_messenger_referrals_rollback_20260915;

drop policy if exists "staff read AI citation logs" on public.ai_citation_logs;
revoke all on public.ai_citation_logs from public, anon, authenticated;
grant select on public.ai_citation_logs to authenticated;
create policy "active admins read AI citation logs" on public.ai_citation_logs
for select to authenticated using ((select private.is_admin()));

alter table public.admin_users drop constraint if exists admin_users_role_check;
alter table public.admin_users add constraint admin_users_role_check check (role in ('owner', 'admin')) not valid;

commit;
