-- Explicit Data API table grants for projects without implicit public-schema
-- privileges (Supabase rollout: 2026-10-30). Keep historical migrations intact.
-- Additive only: existing ACLs, RLS policies, function ACLs and Storage stay intact.
-- Do not restore schema-wide/default grants. Future tables still need an explicit
-- access decision in the migration that creates them.

-- Fail closed if a required public table has lost its row-level protection.
do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'about_sections', 'admin_audit_logs', 'admin_users', 'before_after_items',
    'blog_posts', 'brand_partners', 'cms_content_entries', 'cms_pages',
    'cms_revisions', 'cms_section_templates', 'cms_sections', 'cta_blocks',
    'faqs', 'form_submission_attempts', 'hero_slides', 'home_sections',
    'landing_pages', 'lead_followups', 'leads', 'maintenance_reminder_items',
    'managed_cms_release_permits', 'material_images', 'materials', 'media_assets',
    'notification_settings', 'process_steps', 'project_images', 'projects',
    'quote_requests', 'service_areas', 'services', 'site_pages', 'site_settings',
    'system_event_logs', 'testimonials', 'translation_jobs'
  ] loop
    if not coalesce((select relrowsecurity from pg_class
                    where oid = to_regclass(format('public.%I', table_name))), false) then
      raise exception 'Required RLS-protected table is missing or unprotected: %', table_name;
    end if;
  end loop;
end;
$$;

-- Public-readable content only. Existing RLS decides publication status, parent
-- visibility and soft deletion; media_assets retains its existing read policy.
grant select on table
  public.about_sections, public.before_after_items, public.blog_posts,
  public.brand_partners, public.cms_content_entries, public.cms_pages,
  public.cms_section_templates, public.cms_sections, public.cta_blocks,
  public.faqs, public.hero_slides, public.home_sections, public.landing_pages,
  public.material_images, public.materials, public.media_assets,
  public.process_steps, public.project_images, public.projects,
  public.service_areas, public.services, public.site_pages, public.site_settings,
  public.testimonials
to anon;

-- authenticated is a Postgres login role, NOT an administrator role. The
-- existing MFA/admin-role RLS checks still authorize each individual operation.
grant select, insert, update, delete on table
  public.about_sections, public.before_after_items, public.blog_posts,
  public.brand_partners, public.cms_content_entries, public.cms_pages,
  public.cms_section_templates, public.cms_sections, public.cta_blocks,
  public.faqs, public.hero_slides, public.home_sections, public.landing_pages,
  public.material_images, public.materials, public.media_assets,
  public.process_steps, public.project_images, public.projects,
  public.service_areas, public.services, public.site_pages, public.site_settings,
  public.testimonials, public.admin_users, public.lead_followups, public.leads,
  public.maintenance_reminder_items, public.quote_requests, public.translation_jobs
to authenticated;

-- History is written by the existing SECURITY DEFINER revision trigger.
grant select on table public.cms_revisions to authenticated;
grant select, insert on table public.admin_audit_logs, public.system_event_logs
to authenticated;

-- Server content publishing/translation and the existing isolated JSON restore
-- use SELECT + INSERT + UPDATE (upsert). Enumerate the restore manifest tables;
-- there is no need to grant TRUNCATE, REFERENCES, TRIGGER or blanket DELETE.
grant select, insert, update on table
  public.about_sections, public.admin_audit_logs, public.admin_users,
  public.before_after_items, public.blog_posts, public.brand_partners,
  public.cms_content_entries, public.cms_pages, public.cms_revisions,
  public.cms_sections, public.cta_blocks, public.faqs, public.hero_slides,
  public.home_sections, public.landing_pages, public.lead_followups, public.leads,
  public.maintenance_reminder_items, public.material_images, public.materials,
  public.media_assets, public.notification_settings, public.process_steps,
  public.project_images, public.projects, public.quote_requests,
  public.service_areas, public.services, public.site_pages, public.site_settings,
  public.system_event_logs, public.testimonials
to service_role;

grant select on table public.cms_section_templates to service_role;
grant select, insert on table public.translation_jobs to service_role;
-- Attempts are inserted by the existing atomic SECURITY DEFINER RPC; the
-- maintenance Edge Function only counts and deletes expired records directly.
grant select, delete on table public.form_submission_attempts to service_role;
-- Preserve the existing server-only permit workflow and secret settings boundary.
grant select, insert, update on table public.managed_cms_release_permits
to service_role;

-- All application table identifiers use UUID/text defaults, not sequences.
-- No sequence or function grants are necessary for this compatibility patch.
