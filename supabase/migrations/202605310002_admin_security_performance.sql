-- Tighten admin operations for a smoother and safer professional backend.

alter table public.admin_users
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists version integer not null default 1;

do $$
begin
  if to_regprocedure('public.touch_updated_at_and_version()') is not null then
    drop trigger if exists touch_admin_users_updated_at_version on public.admin_users;
    create trigger touch_admin_users_updated_at_version
    before update on public.admin_users
    for each row execute function public.touch_updated_at_and_version();
  end if;
end $$;

drop policy if exists "Admins can manage admin users" on public.admin_users;
drop policy if exists "Super admins can insert admin users" on public.admin_users;
drop policy if exists "Super admins can update admin users" on public.admin_users;
drop policy if exists "Super admins can delete admin users" on public.admin_users;

create policy "Super admins can insert admin users"
on public.admin_users for insert
with check (public.has_admin_role(array['super_admin']));

create policy "Super admins can update admin users"
on public.admin_users for update
using (public.has_admin_role(array['super_admin']))
with check (public.has_admin_role(array['super_admin']));

create policy "Super admins can delete admin users"
on public.admin_users for delete
using (public.has_admin_role(array['super_admin']));

create or replace function public.audit_admin_users_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.admin_audit_logs (
    admin_user_id,
    action,
    table_name,
    record_id,
    old_value,
    new_value
  )
  values (
    auth.uid(),
    lower(tg_op),
    'admin_users',
    case when tg_op = 'DELETE' then old.user_id else new.user_id end::text,
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) else null end,
    case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) else null end
  );

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists audit_admin_users_change on public.admin_users;
create trigger audit_admin_users_change
after insert or update or delete on public.admin_users
for each row execute function public.audit_admin_users_change();

update storage.buckets
set
  file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
where id = 'site-images';
