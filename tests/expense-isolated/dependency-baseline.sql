-- Approved read-only dependency metadata, 2026-09-09. No business records.
-- Reconstructed relevant ERP dependencies, not a complete production database clone.
create extension if not exists pgcrypto with schema extensions;
create table public."erp_company" (
  "id" uuid default gen_random_uuid() not null,
  "name" text,
  "address" text,
  "phone" text,
  "email" text,
  "tax_id" text,
  "bank_name" text,
  "bank_branch" text,
  "bank_account" text,
  "bank_type" text default 'ออมทรัพย์'::text,
  "sales_person" text,
  "qr_image" text,
  "updated_at" timestamp with time zone default now(),
  "signature_image" text
);
create table public."erp_customers" (
  "id" uuid default gen_random_uuid() not null,
  "name" text not null,
  "contact" text,
  "phone" text,
  "email" text,
  "address" text,
  "tax_id" text,
  "created_at" timestamp with time zone default now(),
  "updated_at" timestamp with time zone default now(),
  "customer_segment" text,
  "business_type" text
);
create table public."erp_documents" (
  "id" uuid default gen_random_uuid() not null,
  "type" text not null,
  "doc_no" text not null,
  "status" text default 'draft'::text not null,
  "customer_id" uuid,
  "customer_name" text,
  "project_name" text,
  "order_id" uuid,
  "reference" text,
  "sales_person" text,
  "date" date,
  "due_date" date,
  "discount" numeric(5,2) default 0,
  "vat" boolean default true,
  "wht" boolean default false,
  "wht_rate" numeric(5,2) default 3,
  "notes" text,
  "override_address" text,
  "bank_name" text,
  "bank_branch" text,
  "bank_account" text,
  "bank_type" text,
  "qr_image" text,
  "deleted" boolean default false,
  "created_at" timestamp with time zone default now(),
  "updated_at" timestamp with time zone default now(),
  "vat_rate" numeric default 7,
  "lead_source" text,
  "marketing_campaign" text,
  "marketing_adset" text,
  "marketing_ad" text,
  "payment_type" text,
  "payment_amount" numeric default 0,
  "payment_date" date,
  "payment_note" text,
  "payment_status" text,
  "deposit_paid" numeric default 0,
  "deposit_date" date,
  "deposit_note" text,
  "discount_type" text default 'percent'::text,
  "internal_expenses" jsonb default '[]'::jsonb not null
);
create table public."erp_document_items" (
  "id" uuid default gen_random_uuid() not null,
  "document_id" uuid not null,
  "sort_order" integer default 0,
  "name" text,
  "sub_title" text,
  "detail" text,
  "unit" text,
  "qty" numeric(12,3) default 1,
  "price" numeric(12,2) default 0,
  "cost_snapshot" numeric(12,2) default 0,
  "cost_unit" text default 'piece'::text,
  "price_unit" text default 'piece'::text,
  "supplier_name" text,
  "width_m" numeric,
  "height_m" numeric,
  "pieces" numeric
);
create table public."erp_products" (
  "id" uuid default gen_random_uuid() not null,
  "name" text not null,
  "unit" text,
  "cost" numeric(12,2) default 0,
  "price" numeric(12,2) default 0,
  "created_at" timestamp with time zone default now(),
  "updated_at" timestamp with time zone default now(),
  "cost_unit" text default 'piece'::text,
  "price_unit" text default 'piece'::text,
  "supplier_name" text
);
create table public."erp_suppliers" (
  "id" uuid default gen_random_uuid() not null,
  "name" text not null,
  "contact" text,
  "phone" text,
  "email" text,
  "tax_id" text,
  "address" text,
  "notes" text,
  "items" jsonb default '[]'::jsonb not null,
  "created_at" timestamp with time zone default now() not null,
  "updated_at" timestamp with time zone default now() not null
);
alter table public."erp_company" add constraint "erp_company_pkey" PRIMARY KEY (id);
alter table public."erp_customers" add constraint "erp_customers_pkey" PRIMARY KEY (id);
alter table public."erp_document_items" add constraint "erp_document_items_pkey" PRIMARY KEY (id);
alter table public."erp_documents" add constraint "erp_documents_pkey" PRIMARY KEY (id);
alter table public."erp_documents" add constraint "erp_documents_status_check" CHECK ((status = ANY (ARRAY['draft'::text, 'sent'::text, 'approved'::text, 'cancelled'::text, 'paid'::text])));
alter table public."erp_documents" add constraint "erp_documents_type_check" CHECK ((type = ANY (ARRAY['quote'::text, 'bill'::text, 'invoice'::text, 'receipt'::text])));
alter table public."erp_products" add constraint "erp_products_pkey" PRIMARY KEY (id);
alter table public."erp_suppliers" add constraint "erp_suppliers_pkey" PRIMARY KEY (id);
alter table public."erp_document_items" add constraint "erp_document_items_document_id_fkey" FOREIGN KEY (document_id) REFERENCES erp_documents(id) ON DELETE CASCADE;
alter table public."erp_documents" add constraint "erp_documents_customer_id_fkey" FOREIGN KEY (customer_id) REFERENCES erp_customers(id) ON DELETE SET NULL;
create function public.update_updated_at() returns trigger language plpgsql set search_path = public as $$ begin new.updated_at := now(); return new; end $$;
create trigger trg_company_updated_at before update on public.erp_company for each row execute function public.update_updated_at();
create trigger trg_customers_updated_at before update on public.erp_customers for each row execute function public.update_updated_at();
create trigger trg_documents_updated_at before update on public.erp_documents for each row execute function public.update_updated_at();
create trigger trg_products_updated_at before update on public.erp_products for each row execute function public.update_updated_at();
create index erp_document_items_document_id_idx on public.erp_document_items(document_id);
create index erp_documents_customer_id_idx on public.erp_documents(customer_id);
create index erp_suppliers_name_idx on public.erp_suppliers(name);
alter table public.erp_company enable row level security;
revoke all on public.erp_company from public, anon, authenticated;
grant select, insert, update, delete on public.erp_company to authenticated;
grant all on public.erp_company to service_role;
alter table public.erp_customers enable row level security;
revoke all on public.erp_customers from public, anon, authenticated;
grant select, insert, update, delete on public.erp_customers to authenticated;
grant all on public.erp_customers to service_role;
alter table public.erp_documents enable row level security;
revoke all on public.erp_documents from public, anon, authenticated;
grant select, insert, update, delete on public.erp_documents to authenticated;
grant all on public.erp_documents to service_role;
alter table public.erp_document_items enable row level security;
revoke all on public.erp_document_items from public, anon, authenticated;
grant select, insert, update, delete on public.erp_document_items to authenticated;
grant all on public.erp_document_items to service_role;
alter table public.erp_products enable row level security;
revoke all on public.erp_products from public, anon, authenticated;
grant select, insert, update, delete on public.erp_products to authenticated;
grant all on public.erp_products to service_role;
alter table public.erp_suppliers enable row level security;
revoke all on public.erp_suppliers from public, anon, authenticated;
grant select, insert, update, delete on public.erp_suppliers to authenticated;
grant all on public.erp_suppliers to service_role;
