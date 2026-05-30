-- Professional admin foundation for a reusable company-website CMS.
-- This migration is additive: it keeps existing FLASH CAST tables working while
-- adding the generic CMS, role, revision, conflict, and recovery foundations.

alter table public.admin_users
  add column if not exists role text not null default 'super_admin';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'admin_users_role_check'
  ) then
    alter table public.admin_users
      add constraint admin_users_role_check
      check (role in ('super_admin', 'content_editor', 'lead_manager', 'viewer'));
  end if;
end $$;

create or replace function public.admin_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select case
    when coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false) then 'super_admin'
    else (
      select au.role
      from public.admin_users au
      where au.user_id = auth.uid()
        and au.active = true
      limit 1
    )
  end;
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

create table if not exists public.cms_pages (
  id uuid primary key default gen_random_uuid(),
  page_key text not null unique,
  path text not null unique,
  title_zh text,
  title_en text,
  seo_title_zh text,
  seo_title_en text,
  seo_description_zh text,
  seo_description_en text,
  seo_keywords_zh text,
  seo_keywords_en text,
  status public.content_status not null default 'draft',
  sort_order integer not null default 0,
  version integer not null default 1,
  deleted_at timestamptz,
  published_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cms_pages_page_key_format check (page_key ~ '^[a-z0-9][a-z0-9_-]*$'),
  constraint cms_pages_path_format check (path = '/' or path ~ '^/[A-Za-z0-9_./:-]+$')
);

create table if not exists public.cms_section_templates (
  id uuid primary key default gen_random_uuid(),
  template_key text not null unique,
  label text not null,
  description text,
  schema jsonb not null default '{}'::jsonb,
  default_content_zh jsonb not null default '{}'::jsonb,
  default_content_en jsonb not null default '{}'::jsonb,
  status public.content_status not null default 'published',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cms_section_templates_key_format check (template_key ~ '^[a-z0-9][a-z0-9_-]*$')
);

create table if not exists public.cms_sections (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references public.cms_pages(id) on delete cascade,
  section_key text not null,
  section_type text not null,
  title_zh text,
  title_en text,
  content_zh jsonb not null default '{}'::jsonb,
  content_en jsonb not null default '{}'::jsonb,
  settings jsonb not null default '{}'::jsonb,
  status public.content_status not null default 'draft',
  sort_order integer not null default 0,
  version integer not null default 1,
  deleted_at timestamptz,
  published_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cms_sections_key_format check (section_key ~ '^[a-z0-9][a-z0-9_-]*$'),
  constraint cms_sections_type_format check (section_type ~ '^[A-Za-z][A-Za-z0-9_]*$'),
  constraint cms_sections_page_key_unique unique (page_id, section_key)
);

create table if not exists public.cms_content_entries (
  id uuid primary key default gen_random_uuid(),
  content_type text not null,
  slug text not null,
  title_zh text,
  title_en text,
  excerpt_zh text,
  excerpt_en text,
  content_zh text,
  content_en text,
  data_zh jsonb not null default '{}'::jsonb,
  data_en jsonb not null default '{}'::jsonb,
  media jsonb not null default '{}'::jsonb,
  status public.content_status not null default 'draft',
  sort_order integer not null default 0,
  version integer not null default 1,
  deleted_at timestamptz,
  published_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cms_content_entries_type_format check (content_type ~ '^[a-z0-9][a-z0-9_-]*$'),
  constraint cms_content_entries_slug_format check (slug ~ '^[a-z0-9][a-z0-9_-]*$'),
  constraint cms_content_entries_type_slug_unique unique (content_type, slug)
);

create table if not exists public.cms_revisions (
  id uuid primary key default gen_random_uuid(),
  entity_table text not null,
  entity_id uuid not null,
  action text not null,
  version integer,
  snapshot jsonb not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint cms_revisions_entity_table_check
    check (entity_table in ('cms_pages', 'cms_sections', 'cms_content_entries')),
  constraint cms_revisions_action_check
    check (action in ('insert', 'update', 'delete', 'restore'))
);

create index if not exists cms_pages_status_sort_idx on public.cms_pages(status, sort_order);
create index if not exists cms_pages_updated_at_idx on public.cms_pages(updated_at desc);
create index if not exists cms_pages_deleted_at_idx on public.cms_pages(deleted_at);
create index if not exists cms_sections_page_status_sort_idx on public.cms_sections(page_id, status, sort_order);
create index if not exists cms_sections_type_idx on public.cms_sections(section_type);
create index if not exists cms_sections_deleted_at_idx on public.cms_sections(deleted_at);
create index if not exists cms_content_entries_type_status_sort_idx on public.cms_content_entries(content_type, status, sort_order);
create index if not exists cms_content_entries_updated_at_idx on public.cms_content_entries(updated_at desc);
create index if not exists cms_content_entries_deleted_at_idx on public.cms_content_entries(deleted_at);
create index if not exists cms_revisions_entity_idx on public.cms_revisions(entity_table, entity_id, created_at desc);

create or replace function public.touch_updated_at_and_version()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  if to_jsonb(new) - 'updated_at' - 'version' is distinct from to_jsonb(old) - 'updated_at' - 'version' then
    new.version = coalesce(old.version, 1) + 1;
  end if;
  return new;
end;
$$;

create or replace function public.record_cms_revision()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  row_snapshot jsonb;
  row_id uuid;
  row_version integer;
  row_action text;
begin
  if tg_op = 'DELETE' then
    row_snapshot = to_jsonb(old);
    row_id = old.id;
    row_version = old.version;
    row_action = 'delete';
  elsif tg_op = 'INSERT' then
    row_snapshot = to_jsonb(new);
    row_id = new.id;
    row_version = new.version;
    row_action = 'insert';
  else
    row_snapshot = to_jsonb(new);
    row_id = new.id;
    row_version = new.version;
    row_action = 'update';
  end if;

  insert into public.cms_revisions(entity_table, entity_id, action, version, snapshot, created_by)
  values (tg_table_name, row_id, row_action, row_version, row_snapshot, auth.uid());

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists touch_cms_pages_updated_at on public.cms_pages;
create trigger touch_cms_pages_updated_at
before update on public.cms_pages
for each row execute function public.touch_updated_at_and_version();

drop trigger if exists touch_cms_section_templates_updated_at on public.cms_section_templates;
create trigger touch_cms_section_templates_updated_at
before update on public.cms_section_templates
for each row execute function public.touch_updated_at();

drop trigger if exists touch_cms_sections_updated_at on public.cms_sections;
create trigger touch_cms_sections_updated_at
before update on public.cms_sections
for each row execute function public.touch_updated_at_and_version();

drop trigger if exists touch_cms_content_entries_updated_at on public.cms_content_entries;
create trigger touch_cms_content_entries_updated_at
before update on public.cms_content_entries
for each row execute function public.touch_updated_at_and_version();

drop trigger if exists record_cms_pages_revision on public.cms_pages;
create trigger record_cms_pages_revision
after insert or update or delete on public.cms_pages
for each row execute function public.record_cms_revision();

drop trigger if exists record_cms_sections_revision on public.cms_sections;
create trigger record_cms_sections_revision
after insert or update or delete on public.cms_sections
for each row execute function public.record_cms_revision();

drop trigger if exists record_cms_content_entries_revision on public.cms_content_entries;
create trigger record_cms_content_entries_revision
after insert or update or delete on public.cms_content_entries
for each row execute function public.record_cms_revision();

alter table public.cms_pages enable row level security;
alter table public.cms_section_templates enable row level security;
alter table public.cms_sections enable row level security;
alter table public.cms_content_entries enable row level security;
alter table public.cms_revisions enable row level security;

drop policy if exists "Public can read published cms pages" on public.cms_pages;
create policy "Public can read published cms pages"
on public.cms_pages for select
using (status = 'published' and deleted_at is null);

drop policy if exists "Public can read published cms section templates" on public.cms_section_templates;
create policy "Public can read published cms section templates"
on public.cms_section_templates for select
using (status = 'published');

drop policy if exists "Public can read published cms sections" on public.cms_sections;
create policy "Public can read published cms sections"
on public.cms_sections for select
using (
  status = 'published'
  and deleted_at is null
  and exists (
    select 1 from public.cms_pages p
    where p.id = cms_sections.page_id
      and p.status = 'published'
      and p.deleted_at is null
  )
);

drop policy if exists "Public can read published cms content entries" on public.cms_content_entries;
create policy "Public can read published cms content entries"
on public.cms_content_entries for select
using (status = 'published' and deleted_at is null);

drop policy if exists "Admins can read cms pages" on public.cms_pages;
create policy "Admins can read cms pages"
on public.cms_pages for select
using (public.is_admin());

drop policy if exists "Editors can manage cms pages" on public.cms_pages;
create policy "Editors can manage cms pages"
on public.cms_pages for all
using (public.has_admin_role(array['super_admin', 'content_editor']))
with check (public.has_admin_role(array['super_admin', 'content_editor']));

drop policy if exists "Admins can read cms section templates" on public.cms_section_templates;
create policy "Admins can read cms section templates"
on public.cms_section_templates for select
using (public.is_admin());

drop policy if exists "Editors can manage cms section templates" on public.cms_section_templates;
create policy "Editors can manage cms section templates"
on public.cms_section_templates for all
using (public.has_admin_role(array['super_admin', 'content_editor']))
with check (public.has_admin_role(array['super_admin', 'content_editor']));

drop policy if exists "Admins can read cms sections" on public.cms_sections;
create policy "Admins can read cms sections"
on public.cms_sections for select
using (public.is_admin());

drop policy if exists "Editors can manage cms sections" on public.cms_sections;
create policy "Editors can manage cms sections"
on public.cms_sections for all
using (public.has_admin_role(array['super_admin', 'content_editor']))
with check (public.has_admin_role(array['super_admin', 'content_editor']));

drop policy if exists "Admins can read cms content entries" on public.cms_content_entries;
create policy "Admins can read cms content entries"
on public.cms_content_entries for select
using (public.is_admin());

drop policy if exists "Editors can manage cms content entries" on public.cms_content_entries;
create policy "Editors can manage cms content entries"
on public.cms_content_entries for all
using (public.has_admin_role(array['super_admin', 'content_editor']))
with check (public.has_admin_role(array['super_admin', 'content_editor']));

drop policy if exists "Admins can read cms revisions" on public.cms_revisions;
create policy "Admins can read cms revisions"
on public.cms_revisions for select
using (public.is_admin());

drop policy if exists "System can create cms revisions" on public.cms_revisions;
create policy "System can create cms revisions"
on public.cms_revisions for insert
with check (public.is_admin());

insert into public.cms_section_templates(template_key, label, description, schema, default_content_zh, default_content_en, sort_order)
values
  ('hero', 'Hero', 'Page hero with title, description, media, and CTA.', '{"type":"object"}', '{}'::jsonb, '{}'::jsonb, 10),
  ('rich_text', 'Rich Text', 'Text or HTML content block.', '{"type":"object"}', '{}'::jsonb, '{}'::jsonb, 20),
  ('service_grid', 'Service Grid', 'List of service cards.', '{"type":"object"}', '{}'::jsonb, '{}'::jsonb, 30),
  ('project_grid', 'Project Grid', 'List of project cards.', '{"type":"object"}', '{}'::jsonb, '{}'::jsonb, 40),
  ('faq', 'FAQ', 'Question and answer list.', '{"type":"object"}', '{}'::jsonb, '{}'::jsonb, 50),
  ('cta', 'CTA', 'Call-to-action block.', '{"type":"object"}', '{}'::jsonb, '{}'::jsonb, 60),
  ('gallery', 'Gallery', 'Image gallery block.', '{"type":"object"}', '{}'::jsonb, '{}'::jsonb, 70)
on conflict (template_key) do nothing;

insert into public.cms_pages (
  page_key, path, title_zh, title_en, seo_title_zh, seo_title_en,
  seo_description_zh, seo_description_en, seo_keywords_zh, seo_keywords_en,
  status, sort_order, published_at
)
select
  sp.page_key,
  case when sp.path is null or sp.path = '' then '/' || sp.page_key else sp.path end,
  sp.title_zh,
  sp.title_en,
  sp.seo_title_zh,
  sp.seo_title_en,
  sp.seo_description_zh,
  sp.seo_description_en,
  sp.seo_keywords_zh,
  sp.seo_keywords_en,
  coalesce(sp.status, 'published'::public.content_status),
  coalesce(sp.sort_order, 0),
  case when sp.status = 'published' then now() else null end
from public.site_pages sp
where sp.page_key is not null
on conflict (page_key) do nothing;

insert into public.cms_pages (page_key, path, title_zh, title_en, status, sort_order, published_at)
values ('home', '/', '首页', 'Home', 'published', 0, now())
on conflict (page_key) do nothing;

insert into public.cms_sections (page_id, section_key, section_type, title_zh, title_en, content_zh, content_en, status, sort_order, published_at)
select
  p.id,
  hs.section_key,
  case
    when hs.section_key = 'stats' then 'Stats'
    when hs.section_key = 'why_choose_us' then 'FeatureGrid'
    else 'RichText'
  end,
  hs.title_zh,
  hs.title_en,
  jsonb_build_object('subtitle', hs.subtitle_zh, 'content', hs.content_zh, 'items', coalesce(hs.items_zh, '[]'::jsonb), 'image_url', hs.image_url, 'button_label', hs.button_label_zh, 'button_url', hs.button_url),
  jsonb_build_object('subtitle', hs.subtitle_en, 'content', hs.content_en, 'items', coalesce(hs.items_en, '[]'::jsonb), 'image_url', hs.image_url, 'button_label', hs.button_label_en, 'button_url', hs.button_url),
  coalesce(hs.status, 'published'::public.content_status),
  coalesce(hs.sort_order, 0),
  case when hs.status = 'published' then now() else null end
from public.home_sections hs
join public.cms_pages p on p.page_key = 'home'
where hs.section_key is not null
on conflict (page_id, section_key) do nothing;

insert into public.cms_sections (page_id, section_key, section_type, title_zh, title_en, content_zh, content_en, status, sort_order, published_at)
select
  p.id,
  asx.section_key,
  case
    when asx.section_key = 'hero' then 'Hero'
    when asx.section_key in ('stats', 'core_values', 'team', 'milestones') then 'FeatureGrid'
    else 'RichText'
  end,
  asx.title_zh,
  asx.title_en,
  jsonb_build_object('subtitle', asx.subtitle_zh, 'content', asx.content_zh, 'items', coalesce(asx.items_zh, '[]'::jsonb), 'image_url', asx.image_url),
  jsonb_build_object('subtitle', asx.subtitle_en, 'content', asx.content_en, 'items', coalesce(asx.items_en, '[]'::jsonb), 'image_url', asx.image_url),
  coalesce(asx.status, 'published'::public.content_status),
  coalesce(asx.sort_order, 0),
  case when asx.status = 'published' then now() else null end
from public.about_sections asx
join public.cms_pages p on p.page_key = 'about'
where asx.section_key is not null
on conflict (page_id, section_key) do nothing;

insert into public.cms_sections (page_id, section_key, section_type, title_zh, title_en, content_zh, content_en, status, sort_order, published_at)
select
  p.id,
  'process_step_' || ps.step_number::text,
  'ProcessStep',
  ps.title_zh,
  ps.title_en,
  jsonb_build_object('description', ps.description_zh, 'icon_key', ps.icon_key, 'step_number', ps.step_number),
  jsonb_build_object('description', ps.description_en, 'icon_key', ps.icon_key, 'step_number', ps.step_number),
  coalesce(ps.status, 'published'::public.content_status),
  coalesce(ps.sort_order, ps.step_number * 10),
  case when ps.status = 'published' then now() else null end
from public.process_steps ps
join public.cms_pages p on p.page_key = 'process'
where ps.step_number is not null
on conflict (page_id, section_key) do nothing;

insert into public.cms_content_entries (
  content_type, slug, title_zh, title_en, excerpt_zh, excerpt_en, content_zh, content_en,
  data_zh, data_en, media, status, sort_order, published_at
)
select
  'service',
  s.slug,
  s.title_zh,
  s.title_en,
  s.excerpt_zh,
  s.excerpt_en,
  s.content_zh,
  s.content_en,
  jsonb_build_object('suitable_for', coalesce(to_jsonb(s.suitable_for_zh), '[]'::jsonb), 'common_projects', coalesce(to_jsonb(s.common_projects_zh), '[]'::jsonb), 'scope_items', coalesce(to_jsonb(s.scope_items_zh), '[]'::jsonb), 'process_steps', coalesce(s.process_steps_zh, '[]'::jsonb), 'faqs', coalesce(s.faqs_zh, '[]'::jsonb)),
  jsonb_build_object('suitable_for', coalesce(to_jsonb(s.suitable_for_en), '[]'::jsonb), 'common_projects', coalesce(to_jsonb(s.common_projects_en), '[]'::jsonb), 'scope_items', coalesce(to_jsonb(s.scope_items_en), '[]'::jsonb), 'process_steps', coalesce(s.process_steps_en, '[]'::jsonb), 'faqs', coalesce(s.faqs_en, '[]'::jsonb)),
  jsonb_build_object('image_url', s.image_url, 'alt_zh', s.alt_zh, 'alt_en', s.alt_en),
  coalesce(s.status, 'draft'::public.content_status),
  coalesce(s.sort_order, 0),
  case when s.status = 'published' then now() else null end
from public.services s
where s.slug is not null
on conflict (content_type, slug) do nothing;

insert into public.cms_content_entries (
  content_type, slug, title_zh, title_en, excerpt_zh, excerpt_en, content_zh, content_en,
  data_zh, data_en, media, status, sort_order, published_at
)
select
  'project',
  p.slug,
  p.title_zh,
  p.title_en,
  p.excerpt_zh,
  p.excerpt_en,
  p.content_zh,
  p.content_en,
  jsonb_build_object('location', p.location, 'area', p.area, 'duration', p.duration, 'budget', p.budget, 'project_type', p.project_type, 'materials', coalesce(to_jsonb(p.materials), '[]'::jsonb), 'scope', coalesce(to_jsonb(p.scope), '[]'::jsonb), 'highlights', coalesce(to_jsonb(p.highlights_zh), '[]'::jsonb), 'client_need', p.client_need_zh),
  jsonb_build_object('location', p.location, 'area', p.area, 'duration', p.duration, 'budget', p.budget, 'project_type', p.project_type, 'materials', coalesce(to_jsonb(p.materials), '[]'::jsonb), 'scope', coalesce(to_jsonb(p.scope), '[]'::jsonb), 'highlights', coalesce(to_jsonb(p.highlights_en), '[]'::jsonb), 'client_need', p.client_need_en),
  jsonb_build_object('image_url', p.image_url),
  coalesce(p.status, 'draft'::public.content_status),
  coalesce(p.sort_order, 0),
  case when p.status = 'published' then now() else null end
from public.projects p
where p.slug is not null
on conflict (content_type, slug) do nothing;

insert into public.cms_content_entries (
  content_type, slug, title_zh, title_en, excerpt_zh, excerpt_en, content_zh, content_en,
  data_zh, data_en, media, status, sort_order, published_at
)
select
  'blog_post',
  b.slug,
  b.title_zh,
  b.title_en,
  b.excerpt_zh,
  b.excerpt_en,
  b.content_zh,
  b.content_en,
  jsonb_build_object('category', b.category, 'tags', coalesce(to_jsonb(b.tags), '[]'::jsonb), 'published_at', b.published_at),
  jsonb_build_object('category', b.category, 'tags', coalesce(to_jsonb(b.tags), '[]'::jsonb), 'published_at', b.published_at),
  jsonb_build_object('cover_image_url', b.cover_image_url, 'alt_zh', b.alt_zh, 'alt_en', b.alt_en),
  coalesce(b.status, 'draft'::public.content_status),
  coalesce(b.sort_order, 0),
  case when b.status = 'published' then now() else null end
from public.blog_posts b
where b.slug is not null
on conflict (content_type, slug) do nothing;

-- Existing editable tables also get version columns for optimistic conflict checks.
do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'site_pages', 'home_sections', 'about_sections', 'process_steps', 'cta_blocks',
    'services', 'projects', 'materials', 'blog_posts', 'faqs', 'before_after_items',
    'brand_partners', 'testimonials', 'landing_pages', 'service_areas',
    'media_assets', 'site_settings', 'leads', 'quote_requests'
  ]
  loop
    execute format('alter table if exists public.%I add column if not exists version integer not null default 1', table_name);
  end loop;
end $$;

create index if not exists site_pages_status_sort_updated_idx on public.site_pages(status, sort_order, updated_at desc);
create index if not exists home_sections_status_sort_updated_idx on public.home_sections(status, sort_order, updated_at desc);
create index if not exists about_sections_status_sort_updated_idx on public.about_sections(status, sort_order, updated_at desc);
create index if not exists services_status_sort_updated_idx on public.services(status, sort_order, updated_at desc);
create index if not exists projects_status_sort_updated_idx on public.projects(status, sort_order, updated_at desc);
create index if not exists materials_status_sort_updated_idx on public.materials(status, sort_order, updated_at desc);
create index if not exists blog_posts_status_sort_updated_idx on public.blog_posts(status, sort_order, updated_at desc);
create index if not exists leads_status_created_idx on public.leads(status, created_at desc);
create index if not exists quote_requests_status_created_idx on public.quote_requests(status, created_at desc);
