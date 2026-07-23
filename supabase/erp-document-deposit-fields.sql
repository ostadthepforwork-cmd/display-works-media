-- Adds deposit payment fields for ERP documents.
-- These values appear on shared/printed customer documents as deposit paid and balance due.

alter table if exists public.erp_documents
  add column if not exists deposit_paid numeric default 0,
  add column if not exists deposit_date date,
  add column if not exists deposit_note text;
