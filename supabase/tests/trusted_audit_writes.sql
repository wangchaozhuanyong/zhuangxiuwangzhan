-- Run against a migrated local database. All fixture rows are rolled back.
begin;

insert into auth.users(id, email) values
  ('00000000-0000-0000-0000-000000000901', 'audit-editor@example.test'),
  ('00000000-0000-0000-0000-000000000902', 'audit-viewer@example.test');

insert into public.admin_users(user_id, email, role, active) values
  ('00000000-0000-0000-0000-000000000901', 'audit-editor@example.test', 'content_editor', true),
  ('00000000-0000-0000-0000-000000000902', 'audit-viewer@example.test', 'viewer', true);

insert into public.system_event_logs(event_type, source, message)
values ('backup_restore_verified', 'ops', 'legacy evidence fixture');

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-000000000902","role":"authenticated","aal":"aal2"}', true);

do $$
begin
  begin
    insert into public.admin_audit_logs(admin_user_id, action, table_name)
    values ('00000000-0000-0000-0000-000000000901', 'update', 'cms_pages');
    raise exception 'browser audit forgery accepted';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.cms_revisions(entity_table, entity_id, action, snapshot)
    values ('cms_pages', '00000000-0000-0000-0000-000000000903', 'update', '{}');
    raise exception 'browser CMS revision forgery accepted';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.system_event_logs(event_type, source, message, trusted_backup_evidence)
    values ('backup_restore_verified', 'ops', 'forged evidence', true);
    raise exception 'browser backup evidence forgery accepted';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.system_event_logs(event_type, source, message, actor_id)
    values ('react_render_error', 'admin', 'forged actor', '00000000-0000-0000-0000-000000000901');
    raise exception 'browser diagnostic actor forgery accepted';
  exception when insufficient_privilege then null;
  end;
  insert into public.system_event_logs(event_type, source, message, actor_id)
  values ('react_render_error', 'admin', 'actual browser diagnostic', auth.uid());
end;
$$;

select set_config('request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-000000000901","role":"authenticated","aal":"aal2"}', true);
insert into public.cms_pages(id, page_key, path)
values ('00000000-0000-0000-0000-000000000903', 'audit-test', '/audit-test');
update public.cms_pages set status = 'archived' where id = '00000000-0000-0000-0000-000000000903';

do $$
begin
  if not exists (
    select 1 from public.admin_audit_logs
    where admin_user_id = auth.uid() and table_name = 'cms_pages'
      and record_id = '00000000-0000-0000-0000-000000000903'
      and action = 'archive' and new_value ->> 'status' = 'archived'
  ) then raise exception 'actual admin edit did not create an actor-bound audit'; end if;
  if not exists (
    select 1 from public.cms_revisions
    where created_by = auth.uid() and entity_id = '00000000-0000-0000-0000-000000000903'
      and action = 'update'
  ) then raise exception 'CMS trigger did not write a revision'; end if;
end;
$$;

reset role;
set local role service_role;
select set_config('request.jwt.claims','{"role":"service_role"}',true);
insert into public.system_event_logs(event_type, source, message, trusted_backup_evidence)
values ('backup_restore_verified', 'ops', 'verified server evidence fixture', true);

do $$
begin
  if not exists (
    select 1 from public.system_event_logs
    where trusted_backup_evidence and message = 'verified server evidence fixture'
  ) or exists (
    select 1 from public.system_event_logs
    where trusted_backup_evidence and message = 'legacy evidence fixture'
  ) then raise exception 'legacy and trusted server evidence were not distinguished'; end if;
end;
$$;

reset role;
set local role anon;
select set_config('request.jwt.claims','{"role":"anon"}',true);
select count(*) from public.cms_pages;

rollback;
