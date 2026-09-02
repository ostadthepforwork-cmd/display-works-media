-- Run only after the Batch 2 migration on an isolated Supabase database.
-- Set app.batch_2_owner_id to a real active owner UUID in the same session.
-- The exception subtransaction rolls every fixture and counter increment back.

do $$
declare
  owner_id uuid := nullif(current_setting('app.batch_2_owner_id', true), '')::uuid;
  nonadmin_id uuid;
  customer_id uuid := gen_random_uuid();
  product_id uuid := gen_random_uuid();
  supplier_id uuid := gen_random_uuid();
  request_id uuid := gen_random_uuid();
  document_payload jsonb;
  items_payload jsonb;
  created jsonb;
  edited jsonb;
  retried jsonb;
  v_document_id uuid;
  initial_revision integer;
  denied boolean;
  original_item_count integer;
begin
  if not exists (
    select 1 from public.admin_users
    where user_id = owner_id and role = 'owner' and active
  ) then
    raise exception 'Verified active owner required';
  end if;

  select id into strict nonadmin_id
  from auth.users u
  where u.id <> owner_id
    and not exists (select 1 from public.admin_users a where a.user_id = u.id)
  order by u.id
  limit 1;

  begin
    perform set_config('request.jwt.claim.sub', owner_id::text, true);
    perform set_config('request.jwt.claims', jsonb_build_object('sub', owner_id, 'role', 'authenticated')::text, true);
    execute 'set local role authenticated';

    insert into public.erp_customers(id, name) values (customer_id, 'Batch 2 rollback customer');
    insert into public.erp_products(id, name, cost, price) values (product_id, 'Batch 2 rollback product', 0, 100);
    insert into public.erp_suppliers(id, name) values (supplier_id, 'Batch 2 rollback supplier');

    document_payload := jsonb_build_object(
      'type', 'quote', 'status', 'draft', 'payment_status', 'unpaid',
      'customer_id', customer_id, 'customer_name', 'Batch 2 rollback customer',
      'date', current_date, 'due_date', current_date + 30,
      'vat', true, 'vat_rate', 7, 'wht', false, 'wht_rate', 3,
      'discount', 0, 'discount_type', 'percent', 'payment_amount', 0,
      'deposit_paid', 0, 'internal_expenses', '[]'::jsonb
    );
    items_payload := jsonb_build_array(jsonb_build_object(
      'name', 'Historical snapshot name', 'qty', 1, 'price', 100,
      'cost_snapshot', 0, 'cost_unit', 'piece', 'price_unit', 'piece',
      'product_id', product_id, 'supplier_id', supplier_id,
      'supplier_name', 'Batch 2 rollback supplier'
    ));

    created := public.save_erp_document_v1(document_payload, items_payload, 0, request_id);
    v_document_id := (created -> 'document' ->> 'id')::uuid;
    initial_revision := (created -> 'document' ->> 'revision')::integer;
    if created -> 'document' ->> 'doc_no' !~ '^QT[0-9]{4}-[0-9]{4,}$' then
      raise exception 'Quote number allocation failed';
    end if;
    if (created -> 'items' -> 0 ->> 'cost_snapshot')::numeric <> 0 then
      raise exception 'Intentional zero cost was not preserved';
    end if;

    retried := public.save_erp_document_v1(document_payload, items_payload, 0, request_id);
    if retried <> created then raise exception 'Idempotent retry changed response'; end if;

    denied := false;
    begin
      perform public.save_erp_document_v1(
        document_payload || '{"notes":"different"}'::jsonb,
        items_payload,
        0,
        request_id
      );
    exception when serialization_failure then denied := true;
    end;
    if not denied then raise exception 'Idempotency payload conflict was accepted'; end if;

    edited := public.save_erp_document_v1(
      document_payload || jsonb_build_object('id', v_document_id, 'status', 'sent'),
      items_payload || jsonb_build_array(jsonb_build_object(
        'name', 'Unknown cost item', 'qty', 2, 'price', 50,
        'cost_snapshot', null, 'cost_unit', 'piece', 'price_unit', 'piece'
      )),
      initial_revision,
      gen_random_uuid()
    );
    if jsonb_array_length(edited -> 'items') <> 2 then raise exception 'Add item failed'; end if;
    if edited -> 'items' -> 1 -> 'cost_snapshot' <> 'null'::jsonb then
      raise exception 'Unknown NULL cost was not preserved';
    end if;

    denied := false;
    begin
      perform public.save_erp_document_v1(
        document_payload || jsonb_build_object('id', v_document_id),
        items_payload,
        initial_revision,
        gen_random_uuid()
      );
    exception when serialization_failure then denied := true;
    end;
    if not denied then raise exception 'Stale revision was accepted'; end if;

    select count(*) into original_item_count
    from public.erp_document_items where document_id = v_document_id;

    denied := false;
    begin
      perform public.save_erp_document_v1(
        document_payload || jsonb_build_object('id', v_document_id),
        jsonb_build_array(jsonb_build_object(
          'name', 'Invalid product', 'qty', 1, 'price', 1,
          'product_id', gen_random_uuid()
        )),
        (edited -> 'document' ->> 'revision')::integer,
        gen_random_uuid()
      );
    exception when foreign_key_violation then denied := true;
    end;
    if not denied then raise exception 'Forced item failure was accepted'; end if;
    if (select count(*) from public.erp_document_items i where i.document_id = v_document_id) <> original_item_count then
      raise exception 'Forced item failure partially changed items';
    end if;

    denied := false;
    begin
      perform public.save_erp_document_v1(document_payload, '[]'::jsonb, 0, gen_random_uuid());
    exception when invalid_parameter_value then denied := true;
    end;
    if not denied then raise exception 'Zero-item document was accepted'; end if;

    execute 'reset role';
    perform set_config('request.jwt.claim.sub', nonadmin_id::text, true);
    perform set_config('request.jwt.claims', jsonb_build_object('sub', nonadmin_id, 'role', 'authenticated')::text, true);
    execute 'set local role authenticated';
    denied := false;
    begin
      perform public.save_erp_document_v1(document_payload, items_payload, 0, gen_random_uuid());
    exception when insufficient_privilege then denied := true;
    end;
    if not denied then raise exception 'Non-admin RPC call was accepted'; end if;

    execute 'reset role';
    perform set_config('request.jwt.claim.sub', '', true);
    perform set_config('request.jwt.claims', '{"role":"anon"}', true);
    execute 'set local role anon';
    denied := false;
    begin
      perform public.save_erp_document_v1(document_payload, items_payload, 0, gen_random_uuid());
    exception when insufficient_privilege then denied := true;
    end;
    if not denied then raise exception 'Anonymous RPC call was accepted'; end if;

    execute 'reset role';
    raise sqlstate 'PT002' using message = 'Rollback Batch 2 fixtures';
  exception when sqlstate 'PT002' then null;
  end;

  execute 'reset role';
  if exists (select 1 from public.erp_documents where id = v_document_id)
     or exists (select 1 from public.erp_customers where id = customer_id)
     or exists (select 1 from public.erp_products where id = product_id)
     or exists (select 1 from public.erp_suppliers where id = supplier_id) then
    raise exception 'Batch 2 fixture rollback failed';
  end if;

  perform set_config('app.batch_2_results', jsonb_build_object(
    'atomic_create_edit_add_remove', 'PASS',
    'zero_item_rejection', 'PASS',
    'forced_item_failure_rollback', 'PASS',
    'revision_conflict', 'PASS',
    'idempotent_retry_and_conflict', 'PASS',
    'zero_and_null_cost', 'PASS',
    'owner_allowed_nonadmin_anon_denied', 'PASS',
    'fixtures_rolled_back', true
  )::text, true);
end
$$;

select current_setting('app.batch_2_results')::jsonb as batch_2_results;
