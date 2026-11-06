-- Preserve client diagnostics, but reserve operational evidence for server writers.
alter table public.system_event_logs
  add column trusted_backup_evidence boolean not null default false;

alter table public.system_event_logs add constraint system_event_logs_backup_evidence_check
  check (not trusted_backup_evidence or (source = 'ops' and actor_id is null and event_type in (
    'backup_supabase_completed', 'backup_package_verified',
    'backup_restore_dry_run_completed', 'backup_restore_verified'
  )));

drop policy if exists "Admins can create system event logs" on public.system_event_logs;
create policy "Admins can submit their own browser diagnostics"
on public.system_event_logs for insert to authenticated
with check (
  (select public.is_admin())
  and actor_id = (select auth.uid())
  and source in ('admin', 'frontend')
  and event_type in ('frontend_deploy_cache_mismatch', 'react_render_error')
  and not trusted_backup_evidence
);

revoke insert on public.admin_audit_logs, public.cms_revisions from public, anon, authenticated;
drop policy if exists "Admins can create audit logs" on public.admin_audit_logs;
drop policy if exists "System can create cms revisions" on public.cms_revisions;

-- Browser editing continues under the existing table RLS. The audit trigger records
-- only completed row changes and cannot be called through the Data API.
create schema if not exists private;
create function private.audit_admin_record_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  before_row jsonb;
  after_row jsonb;
  row_id text;
  row_action text := lower(tg_op);
begin
  if actor is null or not public.is_admin() then
    return null;
  end if;

  if tg_op <> 'INSERT' then before_row := to_jsonb(old); end if;
  if tg_op <> 'DELETE' then after_row := to_jsonb(new); end if;
  row_id := coalesce(after_row ->> 'id', before_row ->> 'id');
  if tg_op = 'UPDATE' and after_row ->> 'status' = 'archived'
    and before_row ->> 'status' is distinct from 'archived' then
    row_action := 'archive';
  end if;
  if tg_table_name in ('leads', 'quote_requests') then
    -- Workflow states are sufficient for this audit. Do not duplicate inquiries.
    if before_row is not null then
      before_row := jsonb_build_object('status', before_row -> 'status');
    end if;
    if after_row is not null then
      after_row := jsonb_build_object('status', after_row -> 'status');
    end if;
  end if;

  insert into public.admin_audit_logs(admin_user_id, action, table_name, record_id, old_value, new_value)
  values (actor, row_action, tg_table_name, row_id, before_row, after_row);
  return null;
end;
$$;

revoke all on function private.audit_admin_record_change() from public, anon, authenticated;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'about_sections', 'before_after_items', 'blog_posts', 'brand_partners',
    'cms_content_entries', 'cms_pages', 'cms_sections', 'cta_blocks', 'faqs',
    'hero_slides', 'home_sections', 'landing_pages', 'leads', 'materials',
    'process_steps', 'projects', 'quote_requests', 'service_areas', 'services',
    'site_pages', 'site_settings', 'testimonials'
  ] loop
    execute format(
      'create trigger audit_admin_record_change after insert or update or delete on public.%I
       for each row execute function private.audit_admin_record_change()', table_name
    );
  end loop;
end;
$$;

alter function public.touch_updated_at() set search_path = '';
alter function public.touch_updated_at_and_version() set search_path = '';

-- Preserve the RLS role helpers. Existing row policies evaluate them under anon
-- and authenticated. Trigger-only functions and identity lookup do not need anon.
revoke execute on function public.audit_admin_users_change(), public.protect_last_super_admin(),
  public.record_cms_revision() from public, anon, authenticated;
revoke execute on function public.is_admin_identity() from public, anon;
