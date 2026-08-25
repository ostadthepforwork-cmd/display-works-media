-- Keeps ERP document form fields persistent after refresh/login.
-- Run this once in Supabase SQL Editor for the production database.

alter table if exists public.erp_documents
  add column if not exists vat_rate numeric default 7,
  add column if not exists discount_type text default 'percent',
  add column if not exists lead_source text,
  add column if not exists marketing_campaign text,
  add column if not exists marketing_adset text,
  add column if not exists marketing_ad text,
  add column if not exists payment_type text,
  add column if not exists payment_amount numeric default 0,
  add column if not exists payment_date date,
  add column if not exists payment_note text,
  add column if not exists payment_status text,
  add column if not exists deposit_paid numeric default 0,
  add column if not exists deposit_date date,
  add column if not exists deposit_note text,
  add column if not exists internal_expenses jsonb not null default '[]'::jsonb;

comment on column public.erp_documents.internal_expenses is
  'Internal-only extra costs such as shipping, installation, design, labor, or packaging. Not shown in customer documents.';

alter table if exists public.erp_documents
  alter column payment_status set default 'unpaid';

update public.erp_documents
set payment_status = case
  when lower(coalesce(payment_status, '')) in ('paid', 'completed', 'complete') then 'paid'
  when lower(coalesce(payment_status, '')) in ('partial_paid', 'partial', 'partially_paid', 'overdue') then 'partial_paid'
  when lower(coalesce(payment_status, '')) = 'unpaid' then 'unpaid'
  when lower(coalesce(status, '')) in ('paid', 'completed', 'complete') then 'paid'
  when lower(coalesce(status, '')) in ('partial_paid', 'partial', 'partially_paid', 'overdue') then 'partial_paid'
  else 'unpaid'
end
where payment_status is null
   or payment_status = ''
   or lower(coalesce(payment_status, '')) not in ('unpaid', 'partial_paid', 'paid')
   or lower(coalesce(status, '')) in ('paid', 'partial_paid', 'partial', 'partially_paid', 'overdue', 'completed', 'complete');

update public.erp_documents
set status = case
  when lower(coalesce(status, '')) in ('cancelled', 'canceled', 'void') then 'cancelled'
  when lower(coalesce(status, '')) = 'sent' then 'sent'
  when lower(coalesce(status, '')) in ('approved', 'paid', 'partial_paid', 'partial', 'partially_paid', 'overdue', 'completed', 'complete') then 'approved'
  else 'draft'
end
where status is null
   or lower(coalesce(status, '')) not in ('draft', 'sent', 'approved', 'cancelled');

alter table if exists public.erp_documents
  drop constraint if exists erp_documents_status_check;

alter table if exists public.erp_documents
  add constraint erp_documents_status_check
  check (status in ('draft', 'sent', 'approved', 'cancelled'));

alter table if exists public.erp_documents
  drop constraint if exists erp_documents_payment_status_check;

alter table if exists public.erp_documents
  add constraint erp_documents_payment_status_check
  check (payment_status is null or payment_status in ('unpaid', 'partial_paid', 'paid'));

alter table if exists public.erp_document_items
  add column if not exists cost_unit text default 'piece',
  add column if not exists price_unit text default 'piece',
  add column if not exists supplier_name text,
  add column if not exists width_m numeric,
  add column if not exists height_m numeric,
  add column if not exists pieces numeric;

alter table if exists public.erp_products
  add column if not exists supplier_name text,
  add column if not exists cost_unit text default 'piece',
  add column if not exists price_unit text default 'piece';
