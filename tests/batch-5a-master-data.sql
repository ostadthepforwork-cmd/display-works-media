-- Run only after the Batch 5A migration on an isolated Supabase database.
-- Set app.batch_5a_owner_id to an existing active owner UUID in the same
-- session. The intentional exception rolls all fixtures back.

do $$
declare
  owner_id uuid := nullif(current_setting('app.batch_5a_owner_id', true), '')::uuid;
  nonadmin_id uuid;
  customer_id uuid := gen_random_uuid();
  product_id uuid := gen_random_uuid();
  fixture_supplier_id uuid := gen_random_uuid();
  import_result jsonb;
  retry_result jsonb;
  denied boolean;
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
  order by u.id limit 1;

  begin
    perform set_config('request.jwt.claim.sub', owner_id::text, true);
    perform set_config('request.jwt.claims', jsonb_build_object('sub', owner_id, 'role', 'authenticated')::text, true);
    execute 'set local role authenticated';

    insert into public.erp_customers(id, name) values (customer_id, 'Batch 5A rollback customer');
    insert into public.erp_products(id, name, cost, price, code)
    values (product_id, 'Batch 5A rollback product', null, 0, 'B5A-TEST');
    insert into public.erp_suppliers(id, name, tax_id, items)
    values (fixture_supplier_id, 'Batch 5A rollback supplier', '0105550000000', jsonb_build_array(jsonb_build_object(
      'id', 'legacy-catalog-item', 'name', 'Batch 5A catalog item', 'pricingBasis', 'piece', 'supplierPrice', 0, 'salePrice', 0
    )));

    if (select cost from public.erp_products where id = product_id) is not null then
      raise exception 'Unknown product cost was not preserved as NULL';
    end if;
    if (select price from public.erp_products where id = product_id) <> 0 then
      raise exception 'Intentional zero price was not preserved';
    end if;
    if not exists (select 1 from public.erp_supplier_items si where si.supplier_id = fixture_supplier_id and legacy_source_key = 'legacy-catalog-item') then
      raise exception 'Supplier JSON catalog was not normalized';
    end if;

    update public.erp_customers set archived_at = now(), archived_by = owner_id where id = customer_id;
    update public.erp_products set archived_at = now(), archived_by = owner_id where id = product_id;
    update public.erp_suppliers set archived_at = now(), archived_by = owner_id where id = fixture_supplier_id;
    if not exists (select 1 from public.erp_customers where id = customer_id and archived_at is not null) then
      raise exception 'Archived customer is not readable by exact ID';
    end if;
    update public.erp_customers set archived_at = null, archived_by = null where id = customer_id;

    import_result := public.import_legacy_suppliers_v1(
      repeat('a', 64),
      jsonb_build_array(
        jsonb_build_object('id', 'existing-tax', 'name', 'Different label', 'taxId', '0105550000000'),
        jsonb_build_object('id', 'name-conflict', 'name', 'Batch 5A rollback supplier'),
        jsonb_build_object('id', 'new-supplier', 'name', 'Batch 5A imported supplier', 'items', jsonb_build_array(jsonb_build_object('id', 'new-item', 'name', 'Imported item')))
      )
    );
    retry_result := public.import_legacy_suppliers_v1(repeat('a', 64), '[]'::jsonb);
    if import_result <> retry_result or (import_result ->> 'new_count')::integer <> 1 then
      raise exception 'Legacy supplier import was not idempotent';
    end if;

    denied := false;
    begin
      delete from public.erp_customers where id = customer_id;
    exception when insufficient_privilege then denied := true;
    end;
    if not denied then raise exception 'Customer hard delete was permitted'; end if;

    execute 'reset role';
    perform set_config('request.jwt.claim.sub', nonadmin_id::text, true);
    perform set_config('request.jwt.claims', jsonb_build_object('sub', nonadmin_id, 'role', 'authenticated')::text, true);
    execute 'set local role authenticated';
    denied := false;
    begin
      perform public.import_legacy_suppliers_v1(repeat('b', 64), '[]'::jsonb);
    exception when insufficient_privilege then denied := true;
    end;
    if not denied then raise exception 'Non-admin import was permitted'; end if;

    execute 'reset role';
    perform set_config('request.jwt.claim.sub', '', true);
    perform set_config('request.jwt.claims', '{"role":"anon"}', true);
    execute 'set local role anon';
    denied := false;
    begin
      perform public.import_legacy_suppliers_v1(repeat('c', 64), '[]'::jsonb);
    exception when insufficient_privilege then denied := true;
    end;
    if not denied then raise exception 'Anonymous import was permitted'; end if;

    execute 'reset role';
    raise sqlstate 'PT005' using message = 'Rollback Batch 5A fixtures';
  exception when sqlstate 'PT005' then null;
  end;

  execute 'reset role';
  if exists (select 1 from public.erp_customers where id = customer_id)
     or exists (select 1 from public.erp_products where id = product_id)
     or exists (select 1 from public.erp_suppliers where id = fixture_supplier_id) then
    raise exception 'Batch 5A fixture rollback failed';
  end if;
end
$$;
