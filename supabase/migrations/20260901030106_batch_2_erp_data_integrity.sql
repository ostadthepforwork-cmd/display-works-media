-- Batch 2: additive ERP integrity foundation.
-- This migration intentionally preserves historical document numbers, legacy
-- status='paid' values, item names, and cost snapshots.

do $$
begin
  if exists (
    select 1
    from public.erp_documents
    where deleted is not true
    group by doc_no
    having count(*) > 1
  ) then
    raise exception 'BATCH2_PRECHECK_ACTIVE_DOCUMENT_NUMBER_DUPLICATES';
  end if;

  if exists (
    select 1
    from public.erp_documents child
    left join public.erp_documents parent on parent.id = child.order_id
    where child.order_id is not null
      and (parent.id is null or child.order_id = child.id)
  ) then
    raise exception 'BATCH2_PRECHECK_INVALID_DOCUMENT_CHAIN';
  end if;
end
$$;

alter table public.erp_documents
  add column if not exists revision integer not null default 1;

create or replace function private.set_erp_document_revision()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.revision = old.revision then
    new.revision := old.revision + 1;
  elsif new.revision <> old.revision + 1 then
    raise exception using errcode = '40001', message = 'INVALID_REVISION_INCREMENT';
  end if;
  return new;
end
$$;

drop trigger if exists erp_documents_revision_guard on public.erp_documents;
create trigger erp_documents_revision_guard
before update on public.erp_documents
for each row execute function private.set_erp_document_revision();

alter table public.erp_document_items
  add column if not exists product_id uuid,
  add column if not exists supplier_id uuid;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'erp_document_items_product_id_fkey'
      and conrelid = 'public.erp_document_items'::regclass
  ) then
    alter table public.erp_document_items
      add constraint erp_document_items_product_id_fkey
      foreign key (product_id) references public.erp_products(id) on delete set null;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'erp_document_items_supplier_id_fkey'
      and conrelid = 'public.erp_document_items'::regclass
  ) then
    alter table public.erp_document_items
      add constraint erp_document_items_supplier_id_fkey
      foreign key (supplier_id) references public.erp_suppliers(id) on delete set null;
  end if;
end
$$;

create index if not exists erp_document_items_product_id_idx
  on public.erp_document_items(product_id);

create index if not exists erp_document_items_supplier_id_idx
  on public.erp_document_items(supplier_id);

-- Historical duplicates remain valid. Only concurrently active identities are
-- protected, which matches the verified production data.
create unique index if not exists erp_documents_active_doc_no_uidx
  on public.erp_documents(doc_no)
  where deleted is not true;

create table if not exists public.erp_document_number_counters (
  document_type text not null
    check (document_type in ('quote', 'bill', 'invoice', 'receipt')),
  buddhist_year integer not null check (buddhist_year between 2500 and 9999),
  last_value integer not null check (last_value >= 0),
  updated_at timestamptz not null default now(),
  primary key (document_type, buddhist_year)
);

alter table public.erp_document_number_counters enable row level security;

drop policy if exists "Active admins manage ERP document counters"
  on public.erp_document_number_counters;
create policy "Active admins manage ERP document counters"
  on public.erp_document_number_counters
  for all
  to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

grant select, insert, update on public.erp_document_number_counters to authenticated;
revoke all on public.erp_document_number_counters from anon;

-- Seed counters from every historical number, including deleted rows, so a
-- deleted highest number can never be reused.
insert into public.erp_document_number_counters(document_type, buddhist_year, last_value)
select
  case substring(doc_no from 1 for 2)
    when 'QT' then 'quote'
    when 'BL' then 'bill'
    when 'IV' then 'invoice'
    when 'RC' then 'receipt'
  end,
  substring(doc_no from 3 for 4)::integer,
  max(substring(doc_no from 8)::integer)
from public.erp_documents
where doc_no ~ '^(QT|BL|IV|RC)[0-9]{4}-[0-9]+$'
group by substring(doc_no from 1 for 2), substring(doc_no from 3 for 4)
on conflict (document_type, buddhist_year) do update
set last_value = greatest(
      public.erp_document_number_counters.last_value,
      excluded.last_value
    ),
    updated_at = now();

create table if not exists public.erp_document_save_requests (
  user_id uuid not null references auth.users(id) on delete cascade,
  client_request_id uuid not null,
  payload_hash text not null,
  document_id uuid references public.erp_documents(id) on delete set null,
  response_payload jsonb,
  created_at timestamptz not null default now(),
  primary key (user_id, client_request_id)
);

alter table public.erp_document_save_requests enable row level security;

drop policy if exists "Active admins manage own ERP save requests"
  on public.erp_document_save_requests;
create policy "Active admins manage own ERP save requests"
  on public.erp_document_save_requests
  for all
  to authenticated
  using (
    user_id = (select auth.uid())
    and (select private.is_admin())
  )
  with check (
    user_id = (select auth.uid())
    and (select private.is_admin())
  );

grant select, insert, update on public.erp_document_save_requests to authenticated;
revoke all on public.erp_document_save_requests from anon;

create or replace function public.save_erp_document_v1(
  p_document jsonb,
  p_items jsonb,
  p_expected_revision integer,
  p_client_request_id uuid
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_payload_hash text;
  v_request public.erp_document_save_requests%rowtype;
  v_existing public.erp_documents%rowtype;
  v_saved public.erp_documents%rowtype;
  v_document_id uuid;
  v_document_type text;
  v_status text;
  v_payment_status text;
  v_doc_no text;
  v_prefix text;
  v_buddhist_year integer;
  v_sequence integer;
  v_is_create boolean;
  v_result jsonb;
begin
  if v_user_id is null or not private.is_admin() then
    raise exception using errcode = '42501', message = 'ADMIN_REQUIRED';
  end if;

  if p_document is null or jsonb_typeof(p_document) <> 'object' then
    raise exception using errcode = '22023', message = 'INVALID_DOCUMENT_PAYLOAD';
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' then
    raise exception using errcode = '22023', message = 'INVALID_ITEMS_PAYLOAD';
  end if;
  if jsonb_array_length(p_items) = 0 then
    raise exception using errcode = '22023', message = 'ZERO_ITEMS_NOT_ALLOWED';
  end if;
  if nullif(p_document ->> 'customer_id', '') is null then
    raise exception using errcode = '22023', message = 'CUSTOMER_REQUIRED';
  end if;
  if exists (
    select 1
    from jsonb_array_elements(p_items) as item(value)
    where coalesce(nullif(item.value ->> 'qty', '')::numeric, 0) < 0
       or coalesce(nullif(item.value ->> 'price', '')::numeric, 0) < 0
       or nullif(item.value ->> 'cost_snapshot', '')::numeric < 0
       or nullif(item.value ->> 'width_m', '')::numeric < 0
       or nullif(item.value ->> 'height_m', '')::numeric < 0
       or nullif(item.value ->> 'pieces', '')::numeric < 0
  ) then
    raise exception using errcode = '22023', message = 'NEGATIVE_ITEM_VALUE_NOT_ALLOWED';
  end if;
  if p_client_request_id is null then
    raise exception using errcode = '22023', message = 'CLIENT_REQUEST_ID_REQUIRED';
  end if;

  v_payload_hash := encode(
    extensions.digest(
      convert_to(
        jsonb_build_object(
          'document', p_document,
          'items', p_items,
          'expected_revision', p_expected_revision
        )::text,
        'UTF8'
      ),
      'sha256'
    ),
    'hex'
  );

  insert into public.erp_document_save_requests(
    user_id,
    client_request_id,
    payload_hash
  ) values (
    v_user_id,
    p_client_request_id,
    v_payload_hash
  )
  on conflict (user_id, client_request_id) do nothing;

  select * into strict v_request
  from public.erp_document_save_requests
  where user_id = v_user_id
    and client_request_id = p_client_request_id
  for update;

  if v_request.payload_hash <> v_payload_hash then
    raise exception using errcode = '40001', message = 'IDEMPOTENCY_CONFLICT';
  end if;
  if v_request.response_payload is not null then
    return v_request.response_payload;
  end if;

  v_document_type := lower(coalesce(p_document ->> 'type', ''));
  if v_document_type not in ('quote', 'bill', 'invoice', 'receipt') then
    raise exception using errcode = '22023', message = 'INVALID_DOCUMENT_TYPE';
  end if;

  v_status := lower(coalesce(p_document ->> 'status', 'draft'));
  v_payment_status := lower(coalesce(p_document ->> 'payment_status', 'unpaid'));
  if v_payment_status not in ('unpaid', 'partial_paid', 'paid') then
    raise exception using errcode = '22023', message = 'INVALID_PAYMENT_STATUS';
  end if;

  v_document_id := nullif(p_document ->> 'id', '')::uuid;
  v_is_create := v_document_id is null;

  if v_is_create then
    if coalesce(p_expected_revision, 0) <> 0 then
      raise exception using errcode = '40001', message = 'REVISION_CONFLICT';
    end if;
    if v_status not in ('draft', 'sent', 'approved', 'cancelled') then
      raise exception using errcode = '22023', message = 'INVALID_DOCUMENT_STATUS';
    end if;

    v_document_id := gen_random_uuid();
    v_buddhist_year := extract(year from timezone('Asia/Bangkok', now()))::integer + 543;
    v_prefix := case v_document_type
      when 'quote' then 'QT'
      when 'bill' then 'BL'
      when 'invoice' then 'IV'
      when 'receipt' then 'RC'
    end;

    insert into public.erp_document_number_counters(
      document_type,
      buddhist_year,
      last_value
    ) values (
      v_document_type,
      v_buddhist_year,
      0
    )
    on conflict (document_type, buddhist_year) do nothing;

    update public.erp_document_number_counters
    set last_value = last_value + 1,
        updated_at = now()
    where document_type = v_document_type
      and buddhist_year = v_buddhist_year
    returning last_value into v_sequence;

    if v_sequence is null then
      raise exception using errcode = '55000', message = 'DOCUMENT_NUMBER_ALLOCATION_FAILED';
    end if;
    v_doc_no := v_prefix || v_buddhist_year::text || '-' || lpad(v_sequence::text, 4, '0');

    insert into public.erp_documents(
      id, type, doc_no, status, customer_id, customer_name, project_name,
      order_id, reference, sales_person, lead_source, marketing_campaign,
      marketing_adset, marketing_ad, payment_type, payment_amount,
      payment_date, payment_note, payment_status, date, due_date, discount,
      discount_type, vat, vat_rate, wht, wht_rate, deposit_paid,
      deposit_date, deposit_note, internal_expenses, notes, override_address,
      bank_name, bank_branch, bank_account, bank_type, qr_image, deleted,
      revision
    ) values (
      v_document_id, v_document_type, v_doc_no, v_status,
      nullif(p_document ->> 'customer_id', '')::uuid,
      p_document ->> 'customer_name', p_document ->> 'project_name',
      nullif(p_document ->> 'order_id', '')::uuid,
      p_document ->> 'reference', p_document ->> 'sales_person',
      p_document ->> 'lead_source', p_document ->> 'marketing_campaign',
      p_document ->> 'marketing_adset', p_document ->> 'marketing_ad',
      p_document ->> 'payment_type',
      coalesce(nullif(p_document ->> 'payment_amount', '')::numeric, 0),
      nullif(p_document ->> 'payment_date', '')::date,
      p_document ->> 'payment_note', v_payment_status,
      nullif(p_document ->> 'date', '')::date,
      nullif(p_document ->> 'due_date', '')::date,
      coalesce(nullif(p_document ->> 'discount', '')::numeric, 0),
      coalesce(nullif(p_document ->> 'discount_type', ''), 'percent'),
      coalesce((p_document ->> 'vat')::boolean, true),
      coalesce(nullif(p_document ->> 'vat_rate', '')::numeric, 7),
      coalesce((p_document ->> 'wht')::boolean, false),
      coalesce(nullif(p_document ->> 'wht_rate', '')::numeric, 3),
      coalesce(nullif(p_document ->> 'deposit_paid', '')::numeric, 0),
      nullif(p_document ->> 'deposit_date', '')::date,
      p_document ->> 'deposit_note',
      coalesce(p_document -> 'internal_expenses', '[]'::jsonb),
      p_document ->> 'notes', p_document ->> 'override_address',
      p_document ->> 'bank_name', p_document ->> 'bank_branch',
      p_document ->> 'bank_account', p_document ->> 'bank_type',
      p_document ->> 'qr_image', false, 1
    )
    returning * into v_saved;
  else
    select * into v_existing
    from public.erp_documents
    where id = v_document_id
    for update;

    if not found or v_existing.deleted is true then
      raise exception using errcode = 'P0002', message = 'DOCUMENT_NOT_FOUND';
    end if;
    if p_expected_revision is null or v_existing.revision <> p_expected_revision then
      raise exception using errcode = '40001', message = 'REVISION_CONFLICT';
    end if;
    if v_document_type <> v_existing.type then
      raise exception using errcode = '22023', message = 'DOCUMENT_TYPE_IMMUTABLE';
    end if;
    if v_status not in ('draft', 'sent', 'approved', 'cancelled')
       and not (v_existing.status = 'paid' and v_status = 'paid') then
      raise exception using errcode = '22023', message = 'INVALID_DOCUMENT_STATUS';
    end if;

    update public.erp_documents
    set status = v_status,
        customer_id = nullif(p_document ->> 'customer_id', '')::uuid,
        customer_name = p_document ->> 'customer_name',
        project_name = p_document ->> 'project_name',
        order_id = nullif(p_document ->> 'order_id', '')::uuid,
        reference = p_document ->> 'reference',
        sales_person = p_document ->> 'sales_person',
        lead_source = p_document ->> 'lead_source',
        marketing_campaign = p_document ->> 'marketing_campaign',
        marketing_adset = p_document ->> 'marketing_adset',
        marketing_ad = p_document ->> 'marketing_ad',
        payment_type = p_document ->> 'payment_type',
        payment_amount = coalesce(nullif(p_document ->> 'payment_amount', '')::numeric, 0),
        payment_date = nullif(p_document ->> 'payment_date', '')::date,
        payment_note = p_document ->> 'payment_note',
        payment_status = v_payment_status,
        date = nullif(p_document ->> 'date', '')::date,
        due_date = nullif(p_document ->> 'due_date', '')::date,
        discount = coalesce(nullif(p_document ->> 'discount', '')::numeric, 0),
        discount_type = coalesce(nullif(p_document ->> 'discount_type', ''), 'percent'),
        vat = coalesce((p_document ->> 'vat')::boolean, true),
        vat_rate = coalesce(nullif(p_document ->> 'vat_rate', '')::numeric, 7),
        wht = coalesce((p_document ->> 'wht')::boolean, false),
        wht_rate = coalesce(nullif(p_document ->> 'wht_rate', '')::numeric, 3),
        deposit_paid = coalesce(nullif(p_document ->> 'deposit_paid', '')::numeric, 0),
        deposit_date = nullif(p_document ->> 'deposit_date', '')::date,
        deposit_note = p_document ->> 'deposit_note',
        internal_expenses = coalesce(p_document -> 'internal_expenses', '[]'::jsonb),
        notes = p_document ->> 'notes',
        override_address = p_document ->> 'override_address',
        bank_name = p_document ->> 'bank_name',
        bank_branch = p_document ->> 'bank_branch',
        bank_account = p_document ->> 'bank_account',
        bank_type = p_document ->> 'bank_type',
        qr_image = p_document ->> 'qr_image',
        revision = v_existing.revision + 1,
        updated_at = now()
    where id = v_document_id
    returning * into v_saved;

    delete from public.erp_document_items
    where document_id = v_document_id;
  end if;

  insert into public.erp_document_items(
    id, document_id, sort_order, name, sub_title, detail, unit, qty, price,
    cost_snapshot, cost_unit, price_unit, supplier_name, width_m, height_m,
    pieces, product_id, supplier_id
  )
  select
    case
      when v_is_create then gen_random_uuid()
      else coalesce(nullif(item.value ->> 'id', '')::uuid, gen_random_uuid())
    end,
    v_document_id,
    item.ordinality::integer - 1,
    item.value ->> 'name', item.value ->> 'sub_title',
    item.value ->> 'detail', item.value ->> 'unit',
    coalesce(nullif(item.value ->> 'qty', '')::numeric, 0),
    coalesce(nullif(item.value ->> 'price', '')::numeric, 0),
    nullif(item.value ->> 'cost_snapshot', '')::numeric,
    coalesce(nullif(item.value ->> 'cost_unit', ''), 'piece'),
    coalesce(nullif(item.value ->> 'price_unit', ''), 'piece'),
    item.value ->> 'supplier_name',
    nullif(item.value ->> 'width_m', '')::numeric,
    nullif(item.value ->> 'height_m', '')::numeric,
    nullif(item.value ->> 'pieces', '')::numeric,
    nullif(item.value ->> 'product_id', '')::uuid,
    nullif(item.value ->> 'supplier_id', '')::uuid
  from jsonb_array_elements(p_items) with ordinality as item(value, ordinality);

  select jsonb_build_object(
    'document', to_jsonb(v_saved),
    'items', coalesce(
      jsonb_agg(to_jsonb(i) order by i.sort_order, i.id),
      '[]'::jsonb
    )
  )
  into v_result
  from public.erp_document_items i
  where i.document_id = v_document_id;

  update public.erp_document_save_requests
  set document_id = v_document_id,
      response_payload = v_result
  where user_id = v_user_id
    and client_request_id = p_client_request_id;

  return v_result;
end
$$;

revoke all on function public.save_erp_document_v1(jsonb, jsonb, integer, uuid) from public;
revoke all on function public.save_erp_document_v1(jsonb, jsonb, integer, uuid) from anon;
grant execute on function public.save_erp_document_v1(jsonb, jsonb, integer, uuid) to authenticated;

comment on function public.save_erp_document_v1(jsonb, jsonb, integer, uuid) is
  'Atomically saves one ERP document and its items with active-admin authorization, revision checks, idempotency, and database numbering.';
