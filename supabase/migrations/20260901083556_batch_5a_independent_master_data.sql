-- Batch 5A only: independent ERP master data. This migration intentionally
-- does not create document snapshots, alter document save RPCs, or link
-- document items to product/supplier masters.

do $$
begin
  if exists (
    select 1
    from public.erp_customers
    where nullif(regexp_replace(coalesce(tax_id, ''), '\D', '', 'g'), '') is not null
    group by regexp_replace(tax_id, '\D', '', 'g')
    having count(*) > 1
  ) then
    raise exception 'BATCH5A_PRECHECK_DUPLICATE_CUSTOMER_TAX_ID';
  end if;
end
$$;

alter table public.erp_customers
  add column if not exists archived_at timestamptz,
  add column if not exists archived_by uuid references auth.users(id) on delete set null,
  add column if not exists tax_id_normalized text generated always as (
    nullif(regexp_replace(coalesce(tax_id, ''), '\D', '', 'g'), '')
  ) stored;

alter table public.erp_products
  add column if not exists archived_at timestamptz,
  add column if not exists archived_by uuid references auth.users(id) on delete set null,
  add column if not exists code text,
  add column if not exists code_normalized text generated always as (
    nullif(upper(btrim(coalesce(code, ''))), '')
  ) stored;

-- A missing default cost is unknown. Existing values are deliberately unchanged.
alter table public.erp_products alter column cost drop default;

alter table public.erp_suppliers
  add column if not exists archived_at timestamptz,
  add column if not exists archived_by uuid references auth.users(id) on delete set null;

create index if not exists erp_customers_active_name_idx
  on public.erp_customers (name) where archived_at is null;
create index if not exists erp_products_active_name_idx
  on public.erp_products (name) where archived_at is null;
create index if not exists erp_suppliers_active_name_idx
  on public.erp_suppliers (name) where archived_at is null;
create unique index if not exists erp_products_code_normalized_uidx
  on public.erp_products (code_normalized) where code_normalized is not null;

-- This is deliberately nullable. The approved production candidate is not
-- assigned until the owner confirms the currently blank company name.
alter table public.erp_company
  add column if not exists singleton_key text;
alter table public.erp_company
  drop constraint if exists erp_company_singleton_key_check;
alter table public.erp_company
  add constraint erp_company_singleton_key_check
  check (singleton_key is null or singleton_key = 'primary');
create unique index if not exists erp_company_singleton_primary_uidx
  on public.erp_company (singleton_key) where singleton_key = 'primary';

create table if not exists public.erp_supplier_import_batches (
  id uuid primary key default gen_random_uuid(),
  source_type text not null check (source_type = 'legacy_browser_suppliers'),
  source_fingerprint text not null check (source_fingerprint ~ '^[0-9a-f]{64}$'),
  status text not null check (status in ('completed', 'completed_with_conflicts')),
  actor_id uuid not null references auth.users(id) on delete restrict,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  new_count integer not null default 0 check (new_count >= 0),
  existing_count integer not null default 0 check (existing_count >= 0),
  conflict_count integer not null default 0 check (conflict_count >= 0),
  failed_count integer not null default 0 check (failed_count >= 0),
  result jsonb not null default '{}'::jsonb,
  unique (source_type, source_fingerprint)
);

create table if not exists public.erp_supplier_import_rows (
  batch_id uuid not null references public.erp_supplier_import_batches(id) on delete restrict,
  source_key text not null check (char_length(btrim(source_key)) > 0),
  classification text not null check (classification in ('existing', 'conflict', 'new', 'invalid')),
  supplier_id uuid references public.erp_suppliers(id) on delete set null,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  primary key (batch_id, source_key)
);

create table if not exists public.erp_supplier_items (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid not null references public.erp_suppliers(id) on delete restrict,
  legacy_source_key text not null check (char_length(btrim(legacy_source_key)) > 0),
  name text not null check (char_length(btrim(name)) > 0),
  category text,
  unit text,
  pricing_basis text not null default 'piece' check (pricing_basis in ('piece', 'sqm')),
  width_m numeric,
  height_m numeric,
  quantity numeric,
  supplier_price numeric,
  sale_price numeric,
  notes text,
  archived_at timestamptz,
  archived_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (supplier_id, legacy_source_key)
);

create index if not exists erp_supplier_import_rows_supplier_idx
  on public.erp_supplier_import_rows (supplier_id);
create index if not exists erp_supplier_items_active_supplier_idx
  on public.erp_supplier_items (supplier_id, name) where archived_at is null;

alter table public.erp_supplier_import_batches enable row level security;
alter table public.erp_supplier_import_rows enable row level security;
alter table public.erp_supplier_items enable row level security;

revoke all on table public.erp_supplier_import_batches from public, anon, authenticated;
revoke all on table public.erp_supplier_import_rows from public, anon, authenticated;
revoke all on table public.erp_supplier_items from public, anon, authenticated;
grant select on table public.erp_supplier_import_batches to authenticated;
grant select on table public.erp_supplier_import_rows to authenticated;
grant select, insert, update on table public.erp_supplier_items to authenticated;

create policy "Active admins read supplier import batches"
  on public.erp_supplier_import_batches for select to authenticated
  using ((select private.is_admin()));
create policy "Active admins read supplier import rows"
  on public.erp_supplier_import_rows for select to authenticated
  using ((select private.is_admin()));
create policy "Active admins manage supplier items"
  on public.erp_supplier_items for all to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

-- Normal client save operations retain erp_suppliers.items JSON and project it
-- into normalized catalog rows. No document items are read or written here.
create or replace function private.sync_erp_supplier_items_from_legacy()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  insert into public.erp_supplier_items (
    supplier_id, legacy_source_key, name, category, unit, pricing_basis,
    width_m, height_m, quantity, supplier_price, sale_price, notes, archived_at, archived_by, updated_at
  )
  select
    new.id,
    coalesce(
      nullif(btrim(item.value ->> 'id'), ''),
      encode(extensions.digest(convert_to(item.value::text, 'UTF8'), 'sha256'), 'hex')
    ),
    btrim(item.value ->> 'name'),
    nullif(item.value ->> 'category', ''),
    nullif(item.value ->> 'unit', ''),
    case when item.value ->> 'pricingBasis' = 'sqm' then 'sqm' else 'piece' end,
    nullif(item.value ->> 'widthM', '')::numeric,
    nullif(item.value ->> 'heightM', '')::numeric,
    nullif(item.value ->> 'quantity', '')::numeric,
    nullif(item.value ->> 'supplierPrice', '')::numeric,
    nullif(item.value ->> 'salePrice', '')::numeric,
    nullif(item.value ->> 'note', ''),
    null,
    null,
    now()
  from jsonb_array_elements(
    case when jsonb_typeof(new.items) = 'array' then new.items else '[]'::jsonb end
  ) with ordinality as item(value, ordinality)
  where char_length(btrim(coalesce(item.value ->> 'name', ''))) > 0
  on conflict (supplier_id, legacy_source_key) do update
  set name = excluded.name,
      category = excluded.category,
      unit = excluded.unit,
      pricing_basis = excluded.pricing_basis,
      width_m = excluded.width_m,
      height_m = excluded.height_m,
      quantity = excluded.quantity,
      supplier_price = excluded.supplier_price,
      sale_price = excluded.sale_price,
      notes = excluded.notes,
      archived_at = null,
      archived_by = null,
      updated_at = now();

  update public.erp_supplier_items target
  set archived_at = now(), archived_by = auth.uid(), updated_at = now()
  where target.supplier_id = new.id
    and target.archived_at is null
    and not exists (
      select 1
      from jsonb_array_elements(
        case when jsonb_typeof(new.items) = 'array' then new.items else '[]'::jsonb end
      ) as item(value)
      where target.legacy_source_key = coalesce(
        nullif(btrim(item.value ->> 'id'), ''),
        encode(extensions.digest(convert_to(item.value::text, 'UTF8'), 'sha256'), 'hex')
      )
    );
  return new;
end;
$$;

drop trigger if exists erp_suppliers_sync_normalized_catalog on public.erp_suppliers;
create trigger erp_suppliers_sync_normalized_catalog
after insert or update of items on public.erp_suppliers
for each row execute function private.sync_erp_supplier_items_from_legacy();

-- Backfill is deterministic and preserves the source JSON. It never creates
-- document relationships or deletes legacy catalog data.
update public.erp_suppliers set items = items where jsonb_typeof(items) = 'array';

create or replace function public.import_legacy_suppliers_v1(
  p_source_fingerprint text,
  p_suppliers jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_batch public.erp_supplier_import_batches%rowtype;
  v_entry record;
  v_source_key text;
  v_name text;
  v_tax_id text;
  v_existing public.erp_suppliers%rowtype;
  v_supplier_id uuid;
  v_classification text;
  v_new_count integer := 0;
  v_existing_count integer := 0;
  v_conflict_count integer := 0;
  v_invalid_count integer := 0;
  v_result jsonb;
begin
  if v_actor is null or not private.is_admin() then
    raise exception using errcode = '42501', message = 'ADMIN_REQUIRED';
  end if;
  if p_source_fingerprint !~ '^[0-9a-f]{64}$' then
    raise exception using errcode = '22023', message = 'INVALID_SOURCE_FINGERPRINT';
  end if;
  if p_suppliers is null or jsonb_typeof(p_suppliers) <> 'array' then
    raise exception using errcode = '22023', message = 'INVALID_SUPPLIER_SOURCE';
  end if;

  select * into v_batch
  from public.erp_supplier_import_batches
  where source_type = 'legacy_browser_suppliers'
    and source_fingerprint = p_source_fingerprint;
  if found then
    return coalesce(v_batch.result, '{}'::jsonb);
  end if;

  if exists (
    select 1 from (
      select coalesce(nullif(btrim(value ->> 'id'), ''), ordinality::text) as source_key
      from jsonb_array_elements(p_suppliers) with ordinality as entry(value, ordinality)
    ) keys group by source_key having count(*) > 1
  ) then
    raise exception using errcode = '22023', message = 'DUPLICATE_LEGACY_SOURCE_KEY';
  end if;

  insert into public.erp_supplier_import_batches(source_type, source_fingerprint, status, actor_id)
  values ('legacy_browser_suppliers', p_source_fingerprint, 'completed', v_actor)
  returning * into v_batch;

  for v_entry in
    select value, ordinality
    from jsonb_array_elements(p_suppliers) with ordinality as entry(value, ordinality)
  loop
    v_source_key := coalesce(nullif(btrim(v_entry.value ->> 'id'), ''), v_entry.ordinality::text);
    v_name := btrim(coalesce(v_entry.value ->> 'name', ''));
    v_tax_id := nullif(regexp_replace(coalesce(v_entry.value ->> 'taxId', v_entry.value ->> 'tax_id', ''), '\D', '', 'g'), '');
    v_supplier_id := null;

    if v_name = '' then
      v_classification := 'invalid';
      v_invalid_count := v_invalid_count + 1;
    else
      select * into v_existing from public.erp_suppliers
      where v_tax_id is not null
        and regexp_replace(coalesce(tax_id, ''), '\D', '', 'g') = v_tax_id
      limit 1;
      if found then
        v_classification := 'existing';
        v_supplier_id := v_existing.id;
        v_existing_count := v_existing_count + 1;
      elsif exists (
        select 1 from public.erp_suppliers
        where lower(regexp_replace(btrim(name), '\s+', ' ', 'g')) = lower(regexp_replace(v_name, '\s+', ' ', 'g'))
      ) then
        v_classification := 'conflict';
        v_conflict_count := v_conflict_count + 1;
      else
        insert into public.erp_suppliers(name, contact, phone, email, address, tax_id, notes, items)
        values (
          v_name,
          coalesce(v_entry.value ->> 'contact', ''),
          coalesce(v_entry.value ->> 'phone', ''),
          coalesce(v_entry.value ->> 'email', ''),
          coalesce(v_entry.value ->> 'address', ''),
          coalesce(v_entry.value ->> 'taxId', v_entry.value ->> 'tax_id', ''),
          coalesce(v_entry.value ->> 'note', v_entry.value ->> 'notes', ''),
          case when jsonb_typeof(v_entry.value -> 'items') = 'array' then v_entry.value -> 'items' else '[]'::jsonb end
        ) returning id into v_supplier_id;
        v_classification := 'new';
        v_new_count := v_new_count + 1;
      end if;
    end if;

    insert into public.erp_supplier_import_rows(batch_id, source_key, classification, supplier_id, detail)
    values (v_batch.id, v_source_key, v_classification, v_supplier_id, jsonb_build_object('name_present', v_name <> '', 'tax_id_present', v_tax_id is not null));
  end loop;

  v_result := jsonb_build_object(
    'batch_id', v_batch.id,
    'new_count', v_new_count,
    'existing_count', v_existing_count,
    'conflict_count', v_conflict_count,
    'failed_count', v_invalid_count
  );
  update public.erp_supplier_import_batches
  set status = case when v_conflict_count > 0 or v_invalid_count > 0 then 'completed_with_conflicts' else 'completed' end,
      new_count = v_new_count,
      existing_count = v_existing_count,
      conflict_count = v_conflict_count,
      failed_count = v_invalid_count,
      completed_at = now(),
      result = v_result
  where id = v_batch.id;
  return v_result;
end;
$$;

revoke all on function public.import_legacy_suppliers_v1(text, jsonb) from public, anon;
grant execute on function public.import_legacy_suppliers_v1(text, jsonb) to authenticated;

-- Master records are archive-only from the Data API. Existing active-admin
-- INSERT/UPDATE/SELECT grants and policies remain in place.
revoke delete on public.erp_customers, public.erp_products, public.erp_suppliers from authenticated;
