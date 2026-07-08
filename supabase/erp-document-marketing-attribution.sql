-- Adds internal marketing attribution fields for ERP documents.
-- These fields are used by the admin dashboard only and are not shown in customer PDFs.

alter table if exists public.erp_documents
  add column if not exists lead_source text,
  add column if not exists marketing_campaign text,
  add column if not exists marketing_adset text,
  add column if not exists marketing_ad text;

