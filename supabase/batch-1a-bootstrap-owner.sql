-- Trusted operator only. Run in one transaction after Stage 1.
-- Set app.batch_1a_owner_id to the explicitly approved existing auth user UUID
-- with set_config(..., true) in that SAME transaction before executing this file.
-- No email matching, first-user inference, signup or bulk enrollment is allowed.
do $$
declare
  approved_id uuid := nullif(current_setting('app.batch_1a_owner_id', true), '')::uuid;
  approved_email text;
begin
  if approved_id is null then
    raise exception 'Explicitly approved owner UUID is required';
  end if;
  select email into approved_email from auth.users
  where id = approved_id and deleted_at is null
    and coalesce(is_anonymous, false) = false
    and (banned_until is null or banned_until <= now());
  if approved_email is null then
    raise exception 'Approved owner must be an existing non-anonymous, non-banned auth account';
  end if;
  if exists (select 1 from public.admin_users where user_id <> approved_id) then
    raise exception 'Unexpected memberships exist; review before initial owner bootstrap';
  end if;
  insert into public.admin_users (user_id, email, role, active)
  values (approved_id, approved_email, 'owner', true)
  on conflict (user_id) do nothing;
  if not exists (
    select 1 from public.admin_users
    where user_id = approved_id and role = 'owner' and active = true
  ) then
    raise exception 'Approved owner membership was not verified; stop before enforcement';
  end if;
end;
$$;
