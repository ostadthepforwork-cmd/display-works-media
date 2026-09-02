-- Batch 4 proposed database contract only.
-- DO NOT APPLY until Batch 2 and Batch 3 pass isolated validation and are
-- deployed in that order. This file intentionally performs no backfill.

create table if not exists public.erp_jobs (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.erp_customers(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.erp_jobs enable row level security;
revoke all on table public.erp_jobs from public, anon, authenticated;
grant select on table public.erp_jobs to authenticated;

create policy "Active admins read ERP jobs"
  on public.erp_jobs for select to authenticated
  using ((select private.is_admin()));

alter table public.erp_documents
  add column if not exists job_id uuid references public.erp_jobs(id) on delete restrict;

create index if not exists erp_documents_job_id_idx
  on public.erp_documents(job_id) where job_id is not null;

create table if not exists public.erp_job_financial_reviews (
  job_id uuid primary key references public.erp_jobs(id) on delete restrict,
  actual_expense_complete boolean not null default false,
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete restrict,
  notes text check (notes is null or char_length(notes) <= 1000),
  updated_at timestamptz not null default now(),
  constraint erp_job_financial_reviews_confirmation_check check (
    (not actual_expense_complete and reviewed_at is null and reviewed_by is null)
    or (actual_expense_complete and reviewed_at is not null and reviewed_by is not null)
  )
);

alter table public.erp_job_financial_reviews enable row level security;
revoke all on table public.erp_job_financial_reviews from public, anon, authenticated;
grant select on table public.erp_job_financial_reviews to authenticated;

create policy "Active admins read ERP job financial reviews"
  on public.erp_job_financial_reviews for select to authenticated
  using ((select private.is_admin()));

-- This security-invoker view deliberately exposes raw financial inputs rather
-- than encoding unvalidated historical job-chain assumptions in SQL.
create or replace view public.erp_batch4_document_financial_inputs_v1
with (security_invoker = true)
as
select
  d.id as document_id,
  d.job_id,
  d.order_id,
  d.customer_id,
  d.type as document_type,
  d.status as lifecycle_status,
  d.deleted,
  d.date as document_date,
  d.payment_status,
  d.payment_amount,
  d.payment_date,
  d.discount,
  d.discount_type,
  d.vat,
  d.vat_rate,
  d.internal_expenses,
  i.id as item_id,
  i.product_id,
  i.qty,
  i.pieces,
  i.width_m,
  i.height_m,
  i.price,
  i.price_unit,
  i.cost_snapshot,
  i.cost_unit
from public.erp_documents d
left join public.erp_document_items i on i.document_id = d.id;

revoke all on table public.erp_batch4_document_financial_inputs_v1
  from public, anon, authenticated;
grant select on table public.erp_batch4_document_financial_inputs_v1
  to authenticated;

-- Expense amount excludes VAT for profitability. Archive remains visible;
-- consumers exclude only rows with voided_at set.
create or replace view public.erp_batch4_expense_financial_inputs_v1
with (security_invoker = true)
as
select
  e.id as expense_id,
  e.source_document_id,
  e.customer_id,
  e.expense_date,
  e.expense_class,
  e.amount as recognized_expense_ex_vat,
  e.vat_amount,
  e.payment_status,
  e.paid_at,
  e.archived_at,
  e.voided_at,
  c.code as category_code
from public.erp_expenses e
join public.erp_expense_categories c on c.id = e.category_id;

revoke all on table public.erp_batch4_expense_financial_inputs_v1
  from public, anon, authenticated;
grant select on table public.erp_batch4_expense_financial_inputs_v1
  to authenticated;

comment on table public.erp_jobs is
  'Batch 4 canonical commercial identity. Document order_id remains provenance.';
comment on table public.erp_job_financial_reviews is
  'Explicit owner review proving whether known actual direct expense is complete.';
comment on view public.erp_batch4_document_financial_inputs_v1 is
  'RLS-preserving raw inputs for owner-approved Batch 4 profitability policy.';
comment on view public.erp_batch4_expense_financial_inputs_v1 is
  'RLS-preserving Batch 3 expense inputs; amount excludes VAT from profitability.';
