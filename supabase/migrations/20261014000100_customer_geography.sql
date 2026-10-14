-- Optional structured geography for internal ERP/MKT analytics. No address backfill.
alter table public.erp_customers
  add column if not exists province text,
  add column if not exists postal_code text;

alter table public.erp_customers
  add constraint erp_customers_postal_code_format
  check (postal_code is null or postal_code ~ '^[0-9]{5}$');

notify pgrst, 'reload schema';
