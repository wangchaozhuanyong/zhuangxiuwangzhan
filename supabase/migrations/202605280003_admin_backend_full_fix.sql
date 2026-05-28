-- Admin backend full fix (schema + RLS) for production operations

-- 1) blog_posts: add sort_order for admin ordering
alter table public.blog_posts
add column if not exists sort_order integer default 0;

-- 2) quote_requests: add CRM fields
alter table public.quote_requests
  add column if not exists lost_reason text,
  add column if not exists closed_at timestamptz,
  add column if not exists next_follow_up_at timestamptz;

-- 3) leads: add CRM fields
alter table public.leads
  add column if not exists next_follow_up_at timestamptz,
  add column if not exists closed_at timestamptz,
  add column if not exists lost_reason text,
  add column if not exists deal_value numeric;

-- 4) about_sections
create table if not exists public.about_sections (
  id uuid primary key default gen_random_uuid(),
  section_key text not null,
  title_zh text,
  title_en text,
  subtitle_zh text,
  subtitle_en text,
  content_zh text,
  content_en text,
  image_url text,
  items_zh jsonb default '[]'::jsonb,
  items_en jsonb default '[]'::jsonb,
  status public.content_status default 'published',
  sort_order integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists about_sections_section_key_idx on public.about_sections(section_key);

-- 5) process_steps
create table if not exists public.process_steps (
  id uuid primary key default gen_random_uuid(),
  step_number integer not null,
  title_zh text,
  title_en text,
  description_zh text,
  description_en text,
  icon_key text,
  status public.content_status default 'published',
  sort_order integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists process_steps_step_number_idx on public.process_steps(step_number);

-- 6) cta_blocks
create table if not exists public.cta_blocks (
  id uuid primary key default gen_random_uuid(),
  block_key text not null unique,
  title_zh text,
  title_en text,
  description_zh text,
  description_en text,
  primary_label_zh text,
  primary_label_en text,
  primary_url text,
  secondary_label_zh text,
  secondary_label_en text,
  secondary_url text,
  image_url text,
  status public.content_status default 'published',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 7) admin_audit_logs: ensure table exists (created previously) and enable RLS policies
create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid references auth.users(id) on delete set null,
  action text,
  table_name text,
  record_id text,
  old_value jsonb,
  new_value jsonb,
  created_at timestamptz default now()
);

-- triggers: updated_at
drop trigger if exists touch_about_sections_updated_at on public.about_sections;
create trigger touch_about_sections_updated_at
before update on public.about_sections
for each row execute function public.touch_updated_at();

drop trigger if exists touch_process_steps_updated_at on public.process_steps;
create trigger touch_process_steps_updated_at
before update on public.process_steps
for each row execute function public.touch_updated_at();

drop trigger if exists touch_cta_blocks_updated_at on public.cta_blocks;
create trigger touch_cta_blocks_updated_at
before update on public.cta_blocks
for each row execute function public.touch_updated_at();

-- RLS
alter table public.about_sections enable row level security;
alter table public.process_steps enable row level security;
alter table public.cta_blocks enable row level security;
alter table public.admin_audit_logs enable row level security;

-- Public read policies (published only)
drop policy if exists "Public can read published about sections" on public.about_sections;
create policy "Public can read published about sections"
on public.about_sections for select
using (status = 'published');

drop policy if exists "Public can read published process steps" on public.process_steps;
create policy "Public can read published process steps"
on public.process_steps for select
using (status = 'published');

drop policy if exists "Public can read published cta blocks" on public.cta_blocks;
create policy "Public can read published cta blocks"
on public.cta_blocks for select
using (status = 'published');

-- Admin manage policies
drop policy if exists "Admins can manage about sections" on public.about_sections;
create policy "Admins can manage about sections"
on public.about_sections for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can manage process steps" on public.process_steps;
create policy "Admins can manage process steps"
on public.process_steps for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can manage cta blocks" on public.cta_blocks;
create policy "Admins can manage cta blocks"
on public.cta_blocks for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can read audit logs" on public.admin_audit_logs;
create policy "Admins can read audit logs"
on public.admin_audit_logs for select
using (public.is_admin());

drop policy if exists "Admins can create audit logs" on public.admin_audit_logs;
create policy "Admins can create audit logs"
on public.admin_audit_logs for insert
with check (public.is_admin());

