begin;

create table private.quote_rate_limits (
  key_hash text primary key check (key_hash ~ '^[0-9a-f]{64}$'),
  requests integer not null check (requests between 1 and 6),
  reset_at timestamptz not null
);
create index quote_rate_limits_reset_idx on private.quote_rate_limits(reset_at);
alter table private.quote_rate_limits enable row level security;
revoke all on private.quote_rate_limits from public, anon, authenticated;
grant usage on schema private to service_role;
grant select, insert, update, delete on private.quote_rate_limits to service_role;

create function public.consume_quote_rate_limit_v1(p_key_hash text)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  entry private.quote_rate_limits;
  clock_now timestamptz := statement_timestamp();
begin
  insert into private.quote_rate_limits(key_hash, requests, reset_at)
  values (p_key_hash, 1, clock_now + interval '10 minutes')
  on conflict (key_hash) do update set
    requests = case when quote_rate_limits.reset_at <= clock_now then 1 else least(quote_rate_limits.requests + 1, 6) end,
    reset_at = case when quote_rate_limits.reset_at <= clock_now then clock_now + interval '10 minutes' else quote_rate_limits.reset_at end
  returning * into entry;

  delete from private.quote_rate_limits where key_hash in (
    select key_hash from private.quote_rate_limits where reset_at < clock_now - interval '1 hour' order by reset_at limit 100
  );
  return jsonb_build_object('allowed', entry.requests <= 5, 'retry_after', greatest(1, ceil(extract(epoch from entry.reset_at - clock_now))::integer));
end;
$$;
revoke all on function public.consume_quote_rate_limit_v1(text) from public, anon, authenticated;
grant execute on function public.consume_quote_rate_limit_v1(text) to service_role;
comment on table private.quote_rate_limits is 'Short-lived HMAC request keys only. No raw IP, customer data, or authentication tokens.';

do $$
declare test_key text := repeat(md5(gen_random_uuid()::text), 2); result jsonb; i integer;
begin
  if has_function_privilege('anon','public.consume_quote_rate_limit_v1(text)','execute')
    or has_function_privilege('authenticated','public.consume_quote_rate_limit_v1(text)','execute') then
    raise exception 'Public quota function privilege leak';
  end if;
  begin
    for i in 1..6 loop
      result := public.consume_quote_rate_limit_v1(test_key);
      if (result->>'allowed')::boolean <> (i <= 5) then raise exception 'Quota validation failed'; end if;
    end loop;
    raise sqlstate 'PT001' using message = 'Rollback synthetic quota validation';
  exception when sqlstate 'PT001' then null;
  end;
  if exists(select 1 from private.quote_rate_limits where key_hash=test_key) then raise exception 'Quota fixture remains'; end if;
end;
$$;

commit;
