-- Adds customer profile fields for ERP customer segmentation.
-- These values are internal ERP metadata and are not shown on customer documents.

alter table if exists public.erp_customers
  add column if not exists customer_segment text,
  add column if not exists business_type text;

