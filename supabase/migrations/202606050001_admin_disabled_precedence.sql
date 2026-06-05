-- Make admin_users the source of truth when an admin row exists.
-- A disabled admin row must override legacy auth app_metadata bootstrap claims.

create or replace function public.admin_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  with admin_row as (
    select au.role, au.active
    from public.admin_users au
    where au.user_id = auth.uid()
    limit 1
  )
  select case
    when exists (select 1 from admin_row where active = false) then null
    when exists (select 1 from admin_row where active = true) then (
      select role from admin_row where active = true limit 1
    )
    when coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false) then 'super_admin'
    else null
  end;
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.admin_role() is not null;
$$;

create or replace function public.has_admin_role(allowed_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.admin_role() = any(allowed_roles);
$$;
