-- DEFERRED: run only after applying the Batch 3 migration to an isolated local Supabase database.
-- Never run this file against production. Set app.batch_3_owner_id and app.batch_3_nonadmin_id
-- to synthetic local Auth users. The exception subtransaction rolls back every fixture.

do $$
declare
  owner_id uuid := nullif(current_setting('app.batch_3_owner_id', true), '')::uuid;
  nonadmin_id uuid := nullif(current_setting('app.batch_3_nonadmin_id', true), '')::uuid;
  category_id uuid := gen_random_uuid();
  request_id uuid := gen_random_uuid();
  expense_payload jsonb;
  created jsonb;
  retried jsonb;
  edited jsonb;
  v_expense_id uuid;
  denied boolean;
  event_count integer;
begin
  if not exists (
    select 1 from public.admin_users
    where user_id = owner_id and active and role in ('owner', 'admin')
  ) then raise exception 'Synthetic active admin required'; end if;
  if nonadmin_id is null or nonadmin_id = owner_id then
    raise exception 'Synthetic non-admin required';
  end if;

  begin
    perform set_config('request.jwt.claim.sub', owner_id::text, true);
    perform set_config('request.jwt.claims', jsonb_build_object('sub', owner_id, 'role', 'authenticated')::text, true);
    execute 'set local role authenticated';

    insert into public.erp_expense_categories(id, code, name, default_expense_class)
    values (category_id, 'LOCAL_TEST', 'Synthetic local category', 'operating');

    expense_payload := jsonb_build_object(
      'id', null,
      'expense_date', current_date,
      'category_id', category_id,
      'expense_class', 'operating',
      'description', 'Synthetic Adobe subscription',
      'amount', '1000.00',
      'vat_amount', '70.00',
      'total_amount', '1070.00',
      'withholding_amount', '30.00',
      'payment_status', 'unpaid',
      'paid_at', null,
      'supplier_id', null,
      'customer_id', null,
      'source_document_id', null,
      'reference', null,
      'notes', null,
      'archived', false,
      'void_reason', null
    );

    created := public.save_erp_expense_v1(expense_payload, 0, request_id);
    v_expense_id := (created ->> 'expense_id')::uuid;
    if created ->> 'expense_no' !~ '^EXP[0-9]{4}-[0-9]{4,}$' then
      raise exception 'Expense number allocation failed';
    end if;
    if (created -> 'expense' ->> 'total_amount')::numeric <> 1070
       or (created -> 'expense' ->> 'withholding_amount')::numeric <> 30 then
      raise exception 'Exact expense arithmetic failed';
    end if;
    if created -> 'expense' ->> 'customer_id' is not null
       or created -> 'expense' ->> 'supplier_id' is not null
       or created -> 'expense' ->> 'source_document_id' is not null then
      raise exception 'Independent expense optional links failed';
    end if;

    retried := public.save_erp_expense_v1(expense_payload, 0, request_id);
    if retried ->> 'expense_id' <> created ->> 'expense_id'
       or coalesce((retried ->> 'idempotent_replay')::boolean, false) is not true then
      raise exception 'Idempotent replay failed';
    end if;

    denied := false;
    begin
      perform public.save_erp_expense_v1(
        jsonb_set(expense_payload, '{description}', '"Changed payload"'),
        0,
        request_id
      );
    exception when serialization_failure then denied := true;
    end;
    if not denied then raise exception 'Idempotency conflict was accepted'; end if;

    edited := public.save_erp_expense_v1(
      expense_payload || jsonb_build_object(
        'id', v_expense_id,
        'payment_status', 'paid',
        'paid_at', current_date::text,
        'archived', true
      ),
      (created ->> 'revision')::integer,
      gen_random_uuid()
    );
    if edited -> 'expense' ->> 'payment_status' <> 'paid'
       or edited -> 'expense' ->> 'archived_at' is null then
      raise exception 'Payment/archive transition failed';
    end if;

    denied := false;
    begin
      perform public.save_erp_expense_v1(
        expense_payload || jsonb_build_object('id', v_expense_id),
        (created ->> 'revision')::integer,
        gen_random_uuid()
      );
    exception when serialization_failure then denied := true;
    end;
    if not denied then raise exception 'Stale revision was accepted'; end if;

    select count(*) into event_count
    from public.erp_expense_events event
    where event.expense_id = v_expense_id;
    if event_count < 4 then raise exception 'Expected audit events were not appended'; end if;

    denied := false;
    begin
      update public.erp_expense_events event
      set event_type = 'updated'
      where event.expense_id = v_expense_id;
    exception when insufficient_privilege then denied := true;
    end;
    if not denied then raise exception 'Event mutation was exposed'; end if;

    execute 'reset role';
    perform set_config('request.jwt.claim.sub', nonadmin_id::text, true);
    perform set_config('request.jwt.claims', jsonb_build_object('sub', nonadmin_id, 'role', 'authenticated')::text, true);
    execute 'set local role authenticated';
    denied := false;
    begin
      perform public.save_erp_expense_v1(expense_payload, 0, gen_random_uuid());
    exception when insufficient_privilege then denied := true;
    end;
    if not denied then raise exception 'Non-admin save was accepted'; end if;

    execute 'reset role';
    perform set_config('request.jwt.claim.sub', '', true);
    perform set_config('request.jwt.claims', '{"role":"anon"}', true);
    execute 'set local role anon';
    denied := false;
    begin
      perform public.save_erp_expense_v1(expense_payload, 0, gen_random_uuid());
    exception when insufficient_privilege then denied := true;
    end;
    if not denied then raise exception 'Anonymous save was accepted'; end if;

    execute 'reset role';
    raise sqlstate 'PT003' using message = 'Rollback Batch 3 fixtures';
  exception when sqlstate 'PT003' then null;
  end;

  execute 'reset role';
  if exists (select 1 from public.erp_expenses where id = v_expense_id)
     or exists (select 1 from public.erp_expense_categories where id = category_id) then
    raise exception 'Batch 3 fixture rollback failed';
  end if;

  perform set_config('app.batch_3_results', jsonb_build_object(
    'independent_expense', 'PASS',
    'exact_money_semantics', 'PASS',
    'revision_conflict', 'PASS',
    'idempotency', 'PASS',
    'audit_append_only', 'PASS',
    'owner_allowed_nonadmin_anon_denied', 'PASS',
    'fixtures_rolled_back', true
  )::text, true);
end
$$;

select current_setting('app.batch_3_results')::jsonb as batch_3_results;
