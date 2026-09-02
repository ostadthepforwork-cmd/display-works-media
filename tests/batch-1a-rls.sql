-- Trusted SQL runner only, after enforcement. No valid JWTs are generated.
-- Supply app.batch_1a_owner_id in the SAME transaction. Uses real Auth UUIDs
-- with transaction-local role/claims; this is not a REST authentication test.
-- Every test INSERT/UPDATE is inside an exception subtransaction rolled back
-- on success. No existing business row is changed; no notifications are sent.
do $$
declare
  owner_id uuid := nullif(current_setting('app.batch_1a_owner_id', true), '')::uuid;
  nonadmin_id uuid;
  fixture_id uuid := gen_random_uuid();
  marker text := 'batch-1a-rollback-' || fixture_id::text;
  table_name text;
  statement text;
  statements text[];
  identity text;
  denied boolean;
  n bigint;
begin
  if not exists (select 1 from public.admin_users where user_id=owner_id and role='owner' and active) then
    raise exception 'Verified owner required';
  end if;
  select id into strict nonadmin_id from auth.users u
  where u.id<>owner_id and u.deleted_at is null and not coalesce(u.is_anonymous,false)
    and (u.banned_until is null or u.banned_until<=now())
    and not exists(select 1 from public.admin_users where user_id=u.id)
  order by u.id limit 1;
  statements := array[
    format('insert into public.erp_customers(id,name) values (%L,%L)',fixture_id,marker),
    format('insert into public.erp_products(id,name) values (%L,%L)',fixture_id,marker),
    format('insert into public.erp_suppliers(id,name) values (%L,%L)',fixture_id,marker),
    format('insert into public.erp_company(id,name) values (%L,%L)',fixture_id,marker),
    format('insert into public.erp_documents(id,type,doc_no) values (%L,''quote'',%L)',fixture_id,marker),
    format('insert into public.erp_document_items(id,document_id,name) values (%L,%L,%L)',fixture_id,fixture_id,marker),
    format('insert into public.posts(id,title,slug,published) values (%L,%L,%L,false)',marker,marker,marker),
    format('insert into public.cms_settings(key,value) values (%L,''{}''::jsonb)',marker)
  ];
  begin
    perform set_config('request.jwt.claim.sub',owner_id::text,true);
    perform set_config('request.jwt.claims',jsonb_build_object('sub',owner_id,'role','authenticated')::text,true);
    execute 'set local role authenticated';
    if not private.is_admin() then raise exception 'Owner denied'; end if;
    foreach statement in array statements loop execute statement; end loop;
    foreach table_name in array array['erp_customers','erp_products','erp_suppliers','erp_company','erp_documents','erp_document_items'] loop
      execute format('select count(*) from public.%I where id=$1',table_name) into n using fixture_id;
      if n<>1 then raise exception 'Owner read failed: %',table_name; end if;
      execute format('update public.%I set %I=$1 where id=$2',table_name,
        case when table_name='erp_documents' then 'notes' else 'name' end) using marker||'-updated',fixture_id;
      get diagnostics n = row_count;
      if n<>1 then raise exception 'Owner update failed: %',table_name; end if;
    end loop;
    update public.posts set title=marker||'-updated' where id=marker;
    get diagnostics n = row_count;
    if n<>1 then raise exception 'Owner posts update failed'; end if;
    update public.cms_settings set value='{"verified":true}'::jsonb where key=marker;
    get diagnostics n = row_count;
    if n<>1 then raise exception 'Owner settings update failed'; end if;
    insert into public.posts(id,title,slug,published) values(marker||'-public',marker,marker||'-public',true);
    execute 'reset role';

    foreach identity in array array['nonadmin','anon'] loop
      perform set_config('request.jwt.claim.sub',case when identity='nonadmin' then nonadmin_id::text else '' end,true);
      perform set_config('request.jwt.claims',case when identity='nonadmin'
        then jsonb_build_object('sub',nonadmin_id,'role','authenticated')::text else '{"role":"anon"}' end,true);
      if identity='nonadmin' then execute 'set local role authenticated'; else execute 'set local role anon'; end if;
      foreach table_name in array array['erp_customers','erp_products','erp_suppliers','erp_company','erp_documents','erp_document_items'] loop
        n := 0;
        begin
          execute format('select count(*) from public.%I',table_name) into n;
        exception when insufficient_privilege then n := 0;
        end;
        if n<>0 then raise exception '% ERP read exposed: %',identity,table_name; end if;
        if has_table_privilege(current_user,'public.'||table_name,'TRUNCATE') then
          raise exception '% can truncate %',identity,table_name;
        end if;
      end loop;
      foreach statement in array statements loop
        denied := false;
        begin execute statement; exception when insufficient_privilege then denied := true; end;
        if not denied then raise exception '% write was allowed: %',identity,statement; end if;
      end loop;
      if exists(select 1 from public.posts where published is not true) then raise exception '% draft exposed',identity; end if;
      if not exists(select 1 from public.posts where id=marker||'-public') then raise exception '% public post denied',identity; end if;
      if not exists(select 1 from public.cms_settings where key=marker) then raise exception '% public settings denied',identity; end if;
      if identity='nonadmin' then
        foreach statement in array array[
          format('insert into public.admin_users(user_id,email,role,active) values(%L,''fixture@example.invalid'',''owner'',true)',nonadmin_id),
          format('update public.admin_users set role=''owner'' where user_id=%L',nonadmin_id),
          format('update public.admin_users set active=true where user_id=%L',nonadmin_id)
        ] loop
          denied := false;
          begin execute statement; exception when insufficient_privilege then denied := true; end;
          if not denied then raise exception 'Self-escalation mutation allowed'; end if;
        end loop;
        if exists(select 1 from public.ai_crawler_visits) then raise exception 'AI reads exposed to non-admin'; end if;
      else
        insert into public.quote_requests(id,name,phone,service_type,quantity,status)
        values(fixture_id,marker,'0000000000','authorization rollback test',1,'pending');
      end if;
      execute 'reset role';
    end loop;

    -- Other sessions never see this uncommitted deactivation. The exception
    -- below restores the owner's row together with all test fixtures.
    update public.admin_users set active=false where user_id=owner_id;
    perform set_config('request.jwt.claim.sub',owner_id::text,true);
    perform set_config('request.jwt.claims',jsonb_build_object('sub',owner_id,'role','authenticated')::text,true);
    execute 'set local role authenticated';
    if private.is_admin() then raise exception 'Inactive membership allowed'; end if;
    foreach table_name in array array['erp_customers','erp_products','erp_suppliers','erp_company','erp_documents','erp_document_items'] loop
      execute format('select count(*) from public.%I',table_name) into n;
      if n<>0 then raise exception 'Inactive ERP read exposed'; end if;
    end loop;
    denied := false;
    begin execute statements[1]; exception when insufficient_privilege then denied := true; end;
    if not denied then raise exception 'Inactive ERP write allowed'; end if;
    raise sqlstate 'PT001' using message='Rollback successful verification fixtures';
  exception when sqlstate 'PT001' then null;
  end;
  execute 'reset role';
  if not exists(select 1 from public.admin_users where user_id=owner_id and role='owner' and active) then
    raise exception 'Owner not restored';
  end if;
  if exists(select 1 from public.erp_customers where id=fixture_id)
    or exists(select 1 from public.posts where id=marker)
    or exists(select 1 from public.cms_settings where key=marker)
    or exists(select 1 from public.quote_requests where id=fixture_id) then
    raise exception 'Fixture rollback failed';
  end if;
  perform set_config('app.batch_1a_rls_results',jsonb_build_object(
    'method','SQL role/claims simulation with real Auth UUIDs, NOT signed-token REST',
    'owner_erp_insert_read_update','PASS: all six tables',
    'owner_cms_insert_update','PASS: posts and settings',
    'nonadmin_erp_read_insert','DENIED: all six tables',
    'anonymous_erp_read_insert','DENIED: all six tables',
    'nonadmin_and_anonymous_cms_insert','DENIED',
    'self_membership_insert_role_change_activation','DENIED',
    'nonadmin_ai_read','DENIED','inactive_member_erp','DENIED',
    'public_published_posts_and_settings','PASS: anon and non-admin',
    'public_quote_insert','PASS: rolled back without notifications',
    'fixtures_rolled_back',true,'owner_restored_active',true)::text,true);
end $$;
select current_setting('app.batch_1a_rls_results')::jsonb as rls_results;
