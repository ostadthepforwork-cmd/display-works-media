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
