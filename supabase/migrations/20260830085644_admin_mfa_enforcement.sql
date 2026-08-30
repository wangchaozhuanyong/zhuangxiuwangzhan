-- Require an MFA-backed aal2 JWT before database policies recognize an admin role.

create or replace function public.admin_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select case
    when coalesce(auth.jwt() ->> 'aal', '') <> 'aal2' then null
    else (
      select au.role
      from public.admin_users au
      where au.user_id = auth.uid()
        and au.active = true
      limit 1
    )
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
