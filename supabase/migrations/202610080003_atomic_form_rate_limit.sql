-- Atomic consumption of the existing sliding windows. Hashes only; no customer data.
create or replace function public.consume_form_submission_attempt(
  p_form_type text, p_ip_hash text, p_phone_hash text
) returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_lock bigint;
  v_now timestamptz;
begin
  if p_form_type not in ('contact', 'quote') or p_form_type is null
    or p_ip_hash is null or p_ip_hash !~ '^[a-f0-9]{64}$'
    or (p_phone_hash is not null and p_phone_hash !~ '^[a-f0-9]{64}$') then
    raise exception 'Invalid submission attempt' using errcode = '22023';
  end if;
  -- All callers acquire the same sorted lock keys, including shared phone/IP windows.
  for v_lock in
    select distinct key from unnest(array[
      hashtextextended('form-ip:' || p_ip_hash, 0),
      case when p_phone_hash is null then null else hashtextextended('form-phone:' || p_phone_hash, 0) end
    ]) as keys(key) where key is not null order by key
  loop
    perform pg_advisory_xact_lock(v_lock);
  end loop;
  v_now := clock_timestamp();
  if (select count(*) from public.form_submission_attempts
      where ip_hash = p_ip_hash and created_at >= v_now - interval '1 hour') >= 8 then
    return 'ip_limit';
  end if;
  if p_phone_hash is not null and (select count(*) from public.form_submission_attempts
      where phone_hash = p_phone_hash and created_at >= v_now - interval '24 hours') >= 5 then
    return 'phone_limit';
  end if;
  insert into public.form_submission_attempts(form_type, ip_hash, phone_hash, created_at)
    values (p_form_type, p_ip_hash, p_phone_hash, v_now);
  return 'accepted';
end;
$$;
revoke all on function public.consume_form_submission_attempt(text, text, text) from public, anon, authenticated;
grant execute on function public.consume_form_submission_attempt(text, text, text) to service_role;
