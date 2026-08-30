-- Keep admin allowlist rows bound to their original Supabase Auth identities.

create or replace function public.protect_last_super_admin()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  removes_active_super_admin boolean;
begin
  if tg_op = 'UPDATE' and new.user_id is distinct from old.user_id then
    raise exception using
      errcode = '23514',
      message = 'admin_user_identity_change_forbidden';
  end if;

  removes_active_super_admin := old.active = true
    and old.role = 'super_admin'
    and (
      tg_op = 'DELETE'
      or new.active = false
      or new.role <> 'super_admin'
    );

  if not removes_active_super_admin then
    if tg_op = 'DELETE' then
      return old;
    end if;
    return new;
  end if;

  if auth.uid() = old.user_id then
    raise exception using
      errcode = '23514',
      message = 'self_admin_role_change_forbidden';
  end if;

  perform pg_advisory_xact_lock(hashtext('flashcast_last_super_admin'));

  if not exists (
    select 1
    from public.admin_users au
    where au.user_id <> old.user_id
      and au.active = true
      and au.role = 'super_admin'
  ) then
    raise exception using
      errcode = '23514',
      message = 'last_super_admin_required';
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_last_super_admin on public.admin_users;
create trigger protect_last_super_admin
before update of user_id, role, active or delete on public.admin_users
for each row execute function public.protect_last_super_admin();

revoke all on function public.protect_last_super_admin() from public;
