-- Disposable empty UI dependencies only. NOT a production schema clone.
alter table public.erp_customers add column created_at timestamptz default now();
alter table public.erp_suppliers add column created_at timestamptz default now();
alter table public.erp_documents add column created_at timestamptz default now(), add column deleted boolean default false;
create table public.erp_products(id uuid primary key, created_at timestamptz default now());
create table public.erp_document_items(id uuid primary key, sort_order integer default 0);
create table public.erp_company(id uuid primary key);
alter table public.erp_products enable row level security;
alter table public.erp_document_items enable row level security;
alter table public.erp_company enable row level security;
grant select on public.erp_customers, public.erp_suppliers, public.erp_documents,
  public.erp_products, public.erp_document_items, public.erp_company to authenticated;
create policy browser_owner_read on public.erp_customers for select to authenticated using ((select private.is_admin()));
create policy browser_owner_read on public.erp_suppliers for select to authenticated using ((select private.is_admin()));
create policy browser_owner_read on public.erp_documents for select to authenticated using ((select private.is_admin()));
create policy browser_owner_read on public.erp_products for select to authenticated using ((select private.is_admin()));
create policy browser_owner_read on public.erp_document_items for select to authenticated using ((select private.is_admin()));
create policy browser_owner_read on public.erp_company for select to authenticated using ((select private.is_admin()));
notify pgrst, 'reload schema';
