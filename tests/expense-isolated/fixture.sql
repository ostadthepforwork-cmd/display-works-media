-- Synthetic dependency CONTRACT, not a production schema clone.
-- Only the FK targets required by the expense migration are modeled here.
create extension if not exists pgcrypto with schema extensions;
create table public.erp_customers(id uuid primary key);
create table public.erp_suppliers(id uuid primary key);
create table public.erp_documents(id uuid primary key);
alter table public.erp_customers enable row level security;
alter table public.erp_suppliers enable row level security;
alter table public.erp_documents enable row level security;
revoke all on public.erp_customers, public.erp_suppliers, public.erp_documents from public, anon, authenticated;
create function public.update_updated_at() returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at := now(); return new; end $$;
