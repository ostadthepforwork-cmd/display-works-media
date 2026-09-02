-- PENDING: requires a Supabase-authorized operator with the storage object's
-- ownership privileges. The current project postgres connection cannot revoke
-- grants issued by supabase_storage_admin. Do not change table ownership or
-- grant reserved-role membership to work around this check.
-- Apply atomically as a NEW migration only after the authorized operator is
-- available. This file does not modify any object metadata or stored file.
do $$
begin
  if current_user <> 'supabase_storage_admin'
    and not (select rolsuper from pg_roles where rolname=current_user) then
    raise exception 'Storage owner or platform-authorized superuser required; contact Supabase support';
  end if;
end $$;

revoke truncate, references, trigger on storage.objects from public, anon, authenticated;

do $$
declare client_role text; privilege_name text;
begin
  foreach client_role in array array['anon','authenticated'] loop
    foreach privilege_name in array array['TRUNCATE','REFERENCES','TRIGGER'] loop
      if has_table_privilege(client_role,'storage.objects',privilege_name) then
        raise exception 'Storage grant repair incomplete: % still has %',client_role,privilege_name;
      end if;
    end loop;
  end loop;
end $$;
