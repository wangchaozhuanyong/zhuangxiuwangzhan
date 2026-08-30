-- Prevent admin self-lockout and removal of the last active super admin.

create or replace function public.is_admin_identity()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users au
    where au.user_id = auth.uid()
      and au.active = true
  );
$$;

revoke all on function public.is_admin_identity() from public;
grant execute on function public.is_admin_identity() to authenticated;

create or replace function public.protect_last_super_admin()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  removes_active_super_admin boolean;
begin
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
before update of role, active or delete on public.admin_users
for each row execute function public.protect_last_super_admin();

revoke all on function public.protect_last_super_admin() from public;
