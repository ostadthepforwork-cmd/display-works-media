-- Stage 2. Apply in ONE transaction, only after verified owner bootstrap.
-- The migration runner must first set app.batch_1a_owner_id locally in the same
-- transaction. Missing/incorrect owner identity aborts BEFORE any policy change.
do $$
declare
  approved_id uuid := nullif(current_setting('app.batch_1a_owner_id', true), '')::uuid;
begin
  if approved_id is null or not exists (
    select 1 from public.admin_users m join auth.users u on u.id = m.user_id
    where m.user_id = approved_id and m.role = 'owner' and m.active = true
      and u.deleted_at is null and coalesce(u.is_anonymous, false) = false
      and (u.banned_until is null or u.banned_until <= now())
  ) then
    raise exception 'Verified explicitly approved active owner required before RLS enforcement';
  end if;
  if exists (
    select 1 from pg_policies
    where schemaname = 'public' and (
      (tablename in ('erp_customers', 'erp_products', 'erp_documents',
        'erp_document_items', 'erp_suppliers', 'erp_company')
        and policyname <> 'authenticated full access')
      or (tablename = 'posts' and policyname not in ('Auth full access', 'Public can read published posts'))
      or (tablename = 'cms_settings' and policyname not in ('authenticated write cms settings', 'public read cms settings'))
    )
  ) then
    raise exception 'Policy drift detected; review current policies before enforcement';
  end if;
  if exists (
    select 1 from pg_policies
    where (schemaname = 'storage' and tablename = 'objects'
      and policyname not in ('cms-media auth upload', 'cms-media auth update', 'cms-media auth delete'))
    or (schemaname = 'public' and tablename = 'ai_crawler_visits'
      and policyname not in ('Authenticated users can read AI crawler visits', 'Public AI crawler insert only'))
  ) then
    raise exception 'Storage/AI policy drift detected; review before enforcement';
  end if;
end;
$$;

do $$
declare table_name text;
begin
  foreach table_name in array array[
    'erp_customers', 'erp_products', 'erp_documents',
    'erp_document_items', 'erp_suppliers', 'erp_company'
  ] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('drop policy "authenticated full access" on public.%I', table_name);
    execute format('revoke all on table public.%I from public, anon, authenticated', table_name);
    execute format('grant select, insert, update, delete on table public.%I to authenticated', table_name);
    execute format(
      'create policy "active admins manage ERP" on public.%I for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()))',
      table_name
    );
  end loop;
end;
$$;

drop policy "Auth full access" on public.posts;
revoke all on table public.posts from public, anon, authenticated;
grant select on table public.posts to anon;
grant select, insert, update, delete on table public.posts to authenticated;
alter policy "Public can read published posts" on public.posts
to anon, authenticated using (published = true);
create policy "active admins manage posts" on public.posts
for all to authenticated
using ((select private.is_admin())) with check ((select private.is_admin()));

drop policy "authenticated write cms settings" on public.cms_settings;
revoke all on table public.cms_settings from public, anon, authenticated;
grant select on table public.cms_settings to anon;
grant select, insert, update, delete on table public.cms_settings to authenticated;
alter policy "public read cms settings" on public.cms_settings
to anon, authenticated using (true);
create policy "active admins manage cms settings" on public.cms_settings
for all to authenticated
using ((select private.is_admin())) with check ((select private.is_admin()));

-- Preserve existing telemetry INSERT behavior; only admin reads change in 1A.
drop policy "Authenticated users can read AI crawler visits" on public.ai_crawler_visits;
revoke select, update, delete, truncate, references, trigger on public.ai_crawler_visits from public, anon;
revoke update, delete, truncate, references, trigger on public.ai_crawler_visits from authenticated;
grant select on public.ai_crawler_visits to authenticated;
create policy "active admins read AI crawler visits" on public.ai_crawler_visits
for select to authenticated using ((select private.is_admin()));

drop policy "cms-media auth upload" on storage.objects;
drop policy "cms-media auth update" on storage.objects;
drop policy "cms-media auth delete" on storage.objects;
-- RLS cannot constrain TRUNCATE; preserve CRUD grants used by Storage API.
revoke truncate, references, trigger on storage.objects from public, anon, authenticated;
create policy "cms-media admin read" on storage.objects
for select to authenticated
using (bucket_id = 'cms-media' and (select private.is_admin()));
create policy "cms-media admin upload" on storage.objects
for insert to authenticated
with check (bucket_id = 'cms-media' and (select private.is_admin()));
create policy "cms-media admin update" on storage.objects
for update to authenticated
using (bucket_id = 'cms-media' and (select private.is_admin()))
with check (bucket_id = 'cms-media' and (select private.is_admin()));
create policy "cms-media admin delete" on storage.objects
for delete to authenticated
using (bucket_id = 'cms-media' and (select private.is_admin()));

-- Intentionally unchanged: quote_requests policies/grants, quote-attachments,
-- cms-media bucket/public URLs, business rows, numbering and migration history.
-- AI citation/referral tables are absent in the reviewed DB; do not create them.
