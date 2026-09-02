-- Batch 3 only: additive ERP expense management foundation.
-- This migration does not read or convert erp_documents.internal_expenses.
-- Apply only after isolated SQL/RLS/storage/concurrency validation.

create table if not exists public.erp_expense_categories (
  id uuid primary key default gen_random_uuid(),
  code text not null check (code ~ '^[A-Z0-9][A-Z0-9_-]{1,39}$'),
  name text not null check (char_length(btrim(name)) between 1 and 120),
  default_expense_class text not null
    check (default_expense_class in ('direct', 'operating')),
  active boolean not null default true,
  archived_at timestamptz,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint erp_expense_categories_archive_state_check check (
    (active and archived_at is null) or (not active and archived_at is not null)
  )
);

create unique index if not exists erp_expense_categories_code_uidx
  on public.erp_expense_categories (lower(code));
create index if not exists erp_expense_categories_active_sort_idx
  on public.erp_expense_categories (active, sort_order, name);

create or replace function private.set_erp_expense_category_metadata()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.code := upper(btrim(new.code));
  new.name := btrim(new.name);
  new.updated_at := now();
  if new.active then
    new.archived_at := null;
  elsif new.archived_at is null then
    new.archived_at := now();
  end if;
  return new;
end
$$;

drop trigger if exists erp_expense_categories_metadata on public.erp_expense_categories;
create trigger erp_expense_categories_metadata
before insert or update on public.erp_expense_categories
for each row execute function private.set_erp_expense_category_metadata();

create table if not exists public.erp_expenses (
  id uuid primary key default gen_random_uuid(),
  expense_no text not null,
  expense_date date not null,
  category_id uuid not null references public.erp_expense_categories(id) on delete restrict,
  expense_class text not null check (expense_class in ('direct', 'operating')),
  description text not null check (char_length(btrim(description)) between 1 and 500),
  amount numeric(14,2) not null check (amount >= 0),
  vat_amount numeric(14,2) not null default 0 check (vat_amount >= 0),
  total_amount numeric(14,2) generated always as (amount + vat_amount) stored,
  withholding_amount numeric(14,2) not null default 0
    check (withholding_amount >= 0 and withholding_amount <= amount + vat_amount),
  payment_status text not null default 'unpaid'
    check (payment_status in ('unpaid', 'paid')),
  paid_at timestamptz,
  supplier_id uuid references public.erp_suppliers(id) on delete set null,
  customer_id uuid references public.erp_customers(id) on delete set null,
  source_document_id uuid references public.erp_documents(id) on delete set null,
  reference text check (reference is null or char_length(reference) <= 200),
  notes text check (notes is null or char_length(notes) <= 2000),
  revision integer not null default 1 check (revision >= 1),
  created_by uuid not null references auth.users(id) on delete restrict,
  updated_by uuid not null references auth.users(id) on delete restrict,
  archived_at timestamptz,
  archived_by uuid references auth.users(id) on delete restrict,
  voided_at timestamptz,
  voided_by uuid references auth.users(id) on delete restrict,
  void_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint erp_expenses_number_format_check check (expense_no ~ '^EXP[0-9]{4}-[0-9]{4,}$'),
  constraint erp_expenses_payment_date_check check (
    (payment_status = 'unpaid' and paid_at is null)
    or (payment_status = 'paid' and paid_at is not null)
  ),
  constraint erp_expenses_archive_actor_check check (
    (archived_at is null and archived_by is null)
    or (archived_at is not null and archived_by is not null)
  ),
  constraint erp_expenses_void_actor_check check (
    (voided_at is null and voided_by is null and void_reason is null)
    or (
      voided_at is not null and voided_by is not null
      and char_length(btrim(void_reason)) between 1 and 500
    )
  )
);

create unique index if not exists erp_expenses_expense_no_uidx
  on public.erp_expenses(expense_no);
create index if not exists erp_expenses_date_idx on public.erp_expenses(expense_date desc);
create index if not exists erp_expenses_category_idx on public.erp_expenses(category_id);
create index if not exists erp_expenses_class_payment_idx
  on public.erp_expenses(expense_class, payment_status);
create index if not exists erp_expenses_supplier_idx
  on public.erp_expenses(supplier_id) where supplier_id is not null;
create index if not exists erp_expenses_customer_idx
  on public.erp_expenses(customer_id) where customer_id is not null;
create index if not exists erp_expenses_source_document_idx
  on public.erp_expenses(source_document_id) where source_document_id is not null;
create index if not exists erp_expenses_workflow_idx
  on public.erp_expenses(archived_at, voided_at, expense_date desc);

create table if not exists public.erp_expense_number_counters (
  buddhist_year integer primary key check (buddhist_year between 2500 and 9999),
  last_value bigint not null check (last_value >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.erp_expense_save_requests (
  user_id uuid not null references auth.users(id) on delete cascade,
  client_request_id uuid not null,
  payload_hash text not null,
  expense_id uuid references public.erp_expenses(id) on delete set null,
  response_payload jsonb,
  created_at timestamptz not null default now(),
  primary key (user_id, client_request_id)
);
create index if not exists erp_expense_save_requests_created_idx
  on public.erp_expense_save_requests(created_at);

create table if not exists public.erp_expense_attachments (
  id uuid primary key,
  expense_id uuid not null references public.erp_expenses(id) on delete restrict,
  storage_path text not null unique,
  original_filename text not null check (char_length(original_filename) between 1 and 180),
  mime_type text not null check (mime_type in ('application/pdf', 'image/jpeg', 'image/png')),
  size_bytes bigint not null check (size_bytes between 1 and 10485760),
  uploaded_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now()
);
create index if not exists erp_expense_attachments_expense_idx
  on public.erp_expense_attachments(expense_id, created_at desc);

create table if not exists public.erp_expense_events (
  id bigint generated always as identity primary key,
  expense_id uuid not null references public.erp_expenses(id) on delete restrict,
  event_type text not null check (event_type in (
    'created', 'updated', 'marked_paid', 'marked_unpaid',
    'archived', 'restored', 'voided', 'attachment_added',
    'category_changed', 'class_changed'
  )),
  actor_id uuid not null references auth.users(id) on delete restrict,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz not null default now()
);
create index if not exists erp_expense_events_expense_idx
  on public.erp_expense_events(expense_id, created_at desc, id desc);

alter table public.erp_expense_categories enable row level security;
alter table public.erp_expenses enable row level security;
alter table public.erp_expense_number_counters enable row level security;
alter table public.erp_expense_save_requests enable row level security;
alter table public.erp_expense_attachments enable row level security;
alter table public.erp_expense_events enable row level security;

revoke all on table public.erp_expense_categories from public, anon, authenticated;
revoke all on table public.erp_expenses from public, anon, authenticated;
revoke all on table public.erp_expense_number_counters from public, anon, authenticated;
revoke all on table public.erp_expense_save_requests from public, anon, authenticated;
revoke all on table public.erp_expense_attachments from public, anon, authenticated;
revoke all on table public.erp_expense_events from public, anon, authenticated;

grant select, insert, update on table public.erp_expense_categories to authenticated;
grant select on table public.erp_expenses to authenticated;
grant select on table public.erp_expense_attachments to authenticated;
grant select on table public.erp_expense_events to authenticated;

create policy "Active admins manage expense categories"
  on public.erp_expense_categories for all to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create policy "Active admins read expenses"
  on public.erp_expenses for select to authenticated
  using ((select private.is_admin()));

create policy "Active admins read expense attachments"
  on public.erp_expense_attachments for select to authenticated
  using ((select private.is_admin()));

create policy "Active admins read expense events"
  on public.erp_expense_events for select to authenticated
  using ((select private.is_admin()));

create or replace function public.save_erp_expense_v1(
  p_expense jsonb,
  p_expected_revision integer,
  p_client_request_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_payload_hash text;
  v_request public.erp_expense_save_requests%rowtype;
  v_existing public.erp_expenses%rowtype;
  v_saved public.erp_expenses%rowtype;
  v_expense_id uuid;
  v_category_id uuid;
  v_category_active boolean;
  v_amount numeric(14,2);
  v_vat_amount numeric(14,2);
  v_total_amount numeric(14,2);
  v_withholding_amount numeric(14,2);
  v_payment_status text;
  v_paid_at timestamptz;
  v_expense_class text;
  v_archive_requested boolean;
  v_void_reason text;
  v_buddhist_year integer;
  v_sequence bigint;
  v_expense_no text;
  v_is_create boolean;
  v_result jsonb;
  v_before jsonb;
  v_after jsonb;
begin
  if v_user_id is null or not private.is_admin() then
    raise exception using errcode = '42501', message = 'ADMIN_REQUIRED';
  end if;
  if p_expense is null or jsonb_typeof(p_expense) <> 'object' then
    raise exception using errcode = '22023', message = 'INVALID_EXPENSE_PAYLOAD';
  end if;
  if p_client_request_id is null then
    raise exception using errcode = '22023', message = 'CLIENT_REQUEST_ID_REQUIRED';
  end if;

  v_payload_hash := encode(
    extensions.digest(
      convert_to(jsonb_build_object(
        'expense', p_expense,
        'expected_revision', p_expected_revision
      )::text, 'UTF8'),
      'sha256'
    ),
    'hex'
  );

  insert into public.erp_expense_save_requests(user_id, client_request_id, payload_hash)
  values (v_user_id, p_client_request_id, v_payload_hash)
  on conflict (user_id, client_request_id) do nothing;

  select * into strict v_request
  from public.erp_expense_save_requests
  where user_id = v_user_id and client_request_id = p_client_request_id
  for update;

  if v_request.payload_hash <> v_payload_hash then
    raise exception using errcode = '40001', message = 'IDEMPOTENCY_CONFLICT';
  end if;
  if v_request.response_payload is not null then
    return jsonb_set(v_request.response_payload, '{idempotent_replay}', 'true'::jsonb, true);
  end if;

  if coalesce(p_expense ->> 'expense_date', '') !~ '^\d{4}-\d{2}-\d{2}$'
     or coalesce(p_expense ->> 'amount', '') !~ '^(0|[1-9][0-9]*)(\.[0-9]{1,2})?$'
     or coalesce(p_expense ->> 'vat_amount', '') !~ '^(0|[1-9][0-9]*)(\.[0-9]{1,2})?$'
     or coalesce(p_expense ->> 'withholding_amount', '') !~ '^(0|[1-9][0-9]*)(\.[0-9]{1,2})?$' then
    raise exception using errcode = '22023', message = 'INVALID_EXPENSE_PAYLOAD';
  end if;

  v_category_id := nullif(p_expense ->> 'category_id', '')::uuid;
  if v_category_id is null then
    raise exception using errcode = '22023', message = 'CATEGORY_REQUIRED';
  end if;
  v_expense_class := lower(coalesce(p_expense ->> 'expense_class', ''));
  if v_expense_class not in ('direct', 'operating') then
    raise exception using errcode = '22023', message = 'INVALID_EXPENSE_CLASS';
  end if;
  if char_length(btrim(coalesce(p_expense ->> 'description', ''))) not between 1 and 500 then
    raise exception using errcode = '22023', message = 'DESCRIPTION_REQUIRED';
  end if;

  v_amount := (p_expense ->> 'amount')::numeric(14,2);
  v_vat_amount := (p_expense ->> 'vat_amount')::numeric(14,2);
  v_total_amount := v_amount + v_vat_amount;
  v_withholding_amount := (p_expense ->> 'withholding_amount')::numeric(14,2);
  if v_amount < 0 or v_vat_amount < 0 or v_withholding_amount < 0
     or v_withholding_amount > v_total_amount
     or coalesce((p_expense ->> 'total_amount')::numeric(14,2), -1) <> v_total_amount then
    raise exception using errcode = '22023', message = 'INVALID_EXPENSE_AMOUNT';
  end if;

  v_payment_status := lower(coalesce(p_expense ->> 'payment_status', ''));
  if v_payment_status not in ('unpaid', 'paid') then
    raise exception using errcode = '22023', message = 'INVALID_PAYMENT_STATUS';
  end if;
  if v_payment_status = 'paid' then
    if coalesce(p_expense ->> 'paid_at', '') !~ '^\d{4}-\d{2}-\d{2}$' then
      raise exception using errcode = '22023', message = 'PAID_AT_REQUIRED';
    end if;
    v_paid_at := ((p_expense ->> 'paid_at')::date::timestamp at time zone 'Asia/Bangkok');
  else
    v_paid_at := null;
  end if;

  v_expense_id := nullif(p_expense ->> 'id', '')::uuid;
  v_is_create := v_expense_id is null;
  v_void_reason := nullif(btrim(coalesce(p_expense ->> 'void_reason', '')), '');

  if v_is_create then
    if coalesce(p_expected_revision, 0) <> 0 then
      raise exception using errcode = '40001', message = 'REVISION_CONFLICT';
    end if;
    if coalesce((p_expense ->> 'archived')::boolean, false) or v_void_reason is not null then
      raise exception using errcode = '22023', message = 'INVALID_CREATE_STATE';
    end if;
  else
    select * into v_existing
    from public.erp_expenses
    where id = v_expense_id
    for update;
    if not found or p_expected_revision is null or v_existing.revision <> p_expected_revision then
      raise exception using errcode = '40001', message = 'REVISION_CONFLICT';
    end if;
    if v_existing.voided_at is not null then
      raise exception using errcode = '22023', message = 'EXPENSE_ALREADY_VOIDED';
    end if;
  end if;

  select active into v_category_active
  from public.erp_expense_categories
  where id = v_category_id;
  if not found then
    raise exception using errcode = '23503', message = 'CATEGORY_REQUIRED';
  end if;
  if not v_category_active and (v_is_create or v_existing.category_id <> v_category_id) then
    raise exception using errcode = '22023', message = 'CATEGORY_ARCHIVED';
  end if;

  if v_is_create then
    v_expense_id := gen_random_uuid();
    v_buddhist_year := extract(year from timezone('Asia/Bangkok', now()))::integer + 543;
    insert into public.erp_expense_number_counters(buddhist_year, last_value)
    values (v_buddhist_year, 0)
    on conflict (buddhist_year) do nothing;
    update public.erp_expense_number_counters
    set last_value = last_value + 1, updated_at = now()
    where buddhist_year = v_buddhist_year
    returning last_value into v_sequence;
    if v_sequence is null then
      raise exception using errcode = '55000', message = 'EXPENSE_NUMBER_ALLOCATION_FAILED';
    end if;
    v_expense_no := 'EXP' || v_buddhist_year::text || '-' || lpad(v_sequence::text, 4, '0');

    insert into public.erp_expenses(
      id, expense_no, expense_date, category_id, expense_class, description,
      amount, vat_amount, withholding_amount, payment_status, paid_at,
      supplier_id, customer_id, source_document_id, reference, notes,
      revision, created_by, updated_by
    ) values (
      v_expense_id, v_expense_no, (p_expense ->> 'expense_date')::date,
      v_category_id, v_expense_class, btrim(p_expense ->> 'description'),
      v_amount, v_vat_amount, v_withholding_amount, v_payment_status, v_paid_at,
      nullif(p_expense ->> 'supplier_id', '')::uuid,
      nullif(p_expense ->> 'customer_id', '')::uuid,
      nullif(p_expense ->> 'source_document_id', '')::uuid,
      nullif(btrim(coalesce(p_expense ->> 'reference', '')), ''),
      nullif(btrim(coalesce(p_expense ->> 'notes', '')), ''),
      1, v_user_id, v_user_id
    ) returning * into v_saved;

    v_after := jsonb_build_object(
      'expense_no', v_saved.expense_no, 'expense_date', v_saved.expense_date,
      'category_id', v_saved.category_id, 'expense_class', v_saved.expense_class,
      'amount', v_saved.amount, 'vat_amount', v_saved.vat_amount,
      'total_amount', v_saved.total_amount, 'withholding_amount', v_saved.withholding_amount,
      'payment_status', v_saved.payment_status
    );
    insert into public.erp_expense_events(expense_id, event_type, actor_id, after_data)
    values (v_saved.id, 'created', v_user_id, v_after);
  else
    v_archive_requested := coalesce((p_expense ->> 'archived')::boolean, false);
    if v_void_reason is not null and char_length(v_void_reason) > 500 then
      raise exception using errcode = '22023', message = 'VOID_REASON_REQUIRED';
    end if;

    v_before := jsonb_build_object(
      'expense_date', v_existing.expense_date, 'category_id', v_existing.category_id,
      'expense_class', v_existing.expense_class, 'amount', v_existing.amount,
      'vat_amount', v_existing.vat_amount, 'total_amount', v_existing.total_amount,
      'withholding_amount', v_existing.withholding_amount,
      'payment_status', v_existing.payment_status,
      'archived', v_existing.archived_at is not null, 'voided', false
    );

    update public.erp_expenses
    set expense_date = (p_expense ->> 'expense_date')::date,
        category_id = v_category_id,
        expense_class = v_expense_class,
        description = btrim(p_expense ->> 'description'),
        amount = v_amount,
        vat_amount = v_vat_amount,
        withholding_amount = v_withholding_amount,
        payment_status = v_payment_status,
        paid_at = v_paid_at,
        supplier_id = nullif(p_expense ->> 'supplier_id', '')::uuid,
        customer_id = nullif(p_expense ->> 'customer_id', '')::uuid,
        source_document_id = nullif(p_expense ->> 'source_document_id', '')::uuid,
        reference = nullif(btrim(coalesce(p_expense ->> 'reference', '')), ''),
        notes = nullif(btrim(coalesce(p_expense ->> 'notes', '')), ''),
        revision = v_existing.revision + 1,
        updated_by = v_user_id,
        archived_at = case
          when v_archive_requested and v_existing.archived_at is null then now()
          when not v_archive_requested then null
          else v_existing.archived_at
        end,
        archived_by = case
          when v_archive_requested and v_existing.archived_at is null then v_user_id
          when not v_archive_requested then null
          else v_existing.archived_by
        end,
        voided_at = case when v_void_reason is not null then now() else null end,
        voided_by = case when v_void_reason is not null then v_user_id else null end,
        void_reason = v_void_reason,
        updated_at = now()
    where id = v_expense_id
    returning * into v_saved;

    v_after := jsonb_build_object(
      'expense_date', v_saved.expense_date, 'category_id', v_saved.category_id,
      'expense_class', v_saved.expense_class, 'amount', v_saved.amount,
      'vat_amount', v_saved.vat_amount, 'total_amount', v_saved.total_amount,
      'withholding_amount', v_saved.withholding_amount,
      'payment_status', v_saved.payment_status,
      'archived', v_saved.archived_at is not null, 'voided', v_saved.voided_at is not null
    );
    insert into public.erp_expense_events(expense_id, event_type, actor_id, before_data, after_data)
    values (v_saved.id, 'updated', v_user_id, v_before, v_after);

    if v_existing.payment_status <> v_saved.payment_status then
      insert into public.erp_expense_events(expense_id, event_type, actor_id, before_data, after_data)
      values (v_saved.id, case when v_saved.payment_status = 'paid' then 'marked_paid' else 'marked_unpaid' end,
        v_user_id, jsonb_build_object('payment_status', v_existing.payment_status),
        jsonb_build_object('payment_status', v_saved.payment_status, 'paid_at', v_saved.paid_at));
    end if;
    if v_existing.category_id <> v_saved.category_id then
      insert into public.erp_expense_events(expense_id, event_type, actor_id, before_data, after_data)
      values (v_saved.id, 'category_changed', v_user_id,
        jsonb_build_object('category_id', v_existing.category_id),
        jsonb_build_object('category_id', v_saved.category_id));
    end if;
    if v_existing.expense_class <> v_saved.expense_class then
      insert into public.erp_expense_events(expense_id, event_type, actor_id, before_data, after_data)
      values (v_saved.id, 'class_changed', v_user_id,
        jsonb_build_object('expense_class', v_existing.expense_class),
        jsonb_build_object('expense_class', v_saved.expense_class));
    end if;
    if v_existing.archived_at is null and v_saved.archived_at is not null then
      insert into public.erp_expense_events(expense_id, event_type, actor_id, before_data, after_data)
      values (v_saved.id, 'archived', v_user_id, jsonb_build_object('archived', false), jsonb_build_object('archived', true));
    elsif v_existing.archived_at is not null and v_saved.archived_at is null then
      insert into public.erp_expense_events(expense_id, event_type, actor_id, before_data, after_data)
      values (v_saved.id, 'restored', v_user_id, jsonb_build_object('archived', true), jsonb_build_object('archived', false));
    end if;
    if v_saved.voided_at is not null then
      insert into public.erp_expense_events(expense_id, event_type, actor_id, before_data, after_data)
      values (v_saved.id, 'voided', v_user_id, jsonb_build_object('voided', false),
        jsonb_build_object('voided', true, 'reason', v_saved.void_reason));
    end if;
  end if;

  v_result := jsonb_build_object(
    'expense_id', v_saved.id,
    'expense_no', v_saved.expense_no,
    'revision', v_saved.revision,
    'updated_at', v_saved.updated_at,
    'expense', to_jsonb(v_saved),
    'idempotent_replay', false
  );
  update public.erp_expense_save_requests
  set expense_id = v_saved.id, response_payload = v_result
  where user_id = v_user_id and client_request_id = p_client_request_id;
  return v_result;
end
$$;

revoke all on function public.save_erp_expense_v1(jsonb, integer, uuid) from public, anon, authenticated;
grant execute on function public.save_erp_expense_v1(jsonb, integer, uuid) to authenticated;

create or replace function public.register_erp_expense_attachment_v1(
  p_expense_id uuid,
  p_attachment_id uuid,
  p_storage_path text,
  p_original_filename text,
  p_mime_type text,
  p_size_bytes bigint
)
returns public.erp_expense_attachments
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_attachment public.erp_expense_attachments%rowtype;
begin
  if v_user_id is null or not private.is_admin() then
    raise exception using errcode = '42501', message = 'ADMIN_REQUIRED';
  end if;
  if not exists (
    select 1 from public.erp_expenses
    where id = p_expense_id and voided_at is null
  ) then
    raise exception using errcode = '22023', message = 'EXPENSE_NOT_AVAILABLE';
  end if;
  if p_storage_path !~ ('^expenses/' || p_expense_id::text || '/' || p_attachment_id::text || '\.(pdf|jpg|jpeg|png)$') then
    raise exception using errcode = '22023', message = 'INVALID_STORAGE_PATH';
  end if;
  if p_mime_type not in ('application/pdf', 'image/jpeg', 'image/png')
     or p_size_bytes not between 1 and 10485760
     or char_length(p_original_filename) not between 1 and 180 then
    raise exception using errcode = '22023', message = 'INVALID_ATTACHMENT_METADATA';
  end if;

  insert into public.erp_expense_attachments(
    id, expense_id, storage_path, original_filename, mime_type, size_bytes, uploaded_by
  ) values (
    p_attachment_id, p_expense_id, p_storage_path, p_original_filename,
    p_mime_type, p_size_bytes, v_user_id
  ) returning * into v_attachment;

  insert into public.erp_expense_events(expense_id, event_type, actor_id, after_data)
  values (p_expense_id, 'attachment_added', v_user_id, jsonb_build_object(
    'attachment_id', p_attachment_id,
    'filename', p_original_filename,
    'mime_type', p_mime_type,
    'size_bytes', p_size_bytes
  ));
  return v_attachment;
end
$$;

revoke all on function public.register_erp_expense_attachment_v1(uuid, uuid, text, text, text, bigint)
  from public, anon, authenticated;
grant execute on function public.register_erp_expense_attachment_v1(uuid, uuid, text, text, text, bigint)
  to authenticated;

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values (
  'erp-expense-evidence',
  'erp-expense-evidence',
  false,
  10485760,
  array['application/pdf', 'image/jpeg', 'image/png']::text[]
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Expense evidence admin read" on storage.objects;
drop policy if exists "Expense evidence admin upload" on storage.objects;

create policy "Expense evidence admin read"
on storage.objects for select to authenticated
using (
  bucket_id = 'erp-expense-evidence'
  and (select private.is_admin())
  and name ~ '^expenses/[0-9a-f-]{36}/[0-9a-f-]{36}\.(pdf|jpg|jpeg|png)$'
);

create policy "Expense evidence admin upload"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'erp-expense-evidence'
  and (select private.is_admin())
  and name ~ '^expenses/[0-9a-f-]{36}/[0-9a-f-]{36}\.(pdf|jpg|jpeg|png)$'
  and exists (
    select 1 from public.erp_expenses expense
    where expense.id::text = split_part(name, '/', 2)
      and expense.voided_at is null
  )
);

comment on table public.erp_expenses is
  'Batch 3 actual expenses. erp_documents.internal_expenses remains estimated legacy document cost.';
comment on table public.erp_expense_events is
  'Append-only expense history. Direct client INSERT, UPDATE and DELETE are revoked.';
comment on function public.save_erp_expense_v1(jsonb, integer, uuid) is
  'Authorized atomic expense save with database numbering, revision checks, idempotency and audit events.';
