create table if not exists public.site_settings (
  id text primary key default 'default',
  company_name text,
  brand_name text,
  ssm_number text,
  email text,
  phone_display text,
  phone_e164 text,
  whatsapp_number text,
  address_zh text,
  address_en text,
  short_address_zh text,
  short_address_en text,
  facebook_url text,
  instagram_url text,
  tiktok_url text,
  xiaohongshu_url text,
  linkedin_url text,
  logo_url text,
  favicon_url text,
  og_image_url text,
  default_seo_title_zh text,
  default_seo_title_en text,
  default_seo_description_zh text,
  default_seo_description_en text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint site_settings_singleton check (id = 'default')
);

create table if not exists public.lead_followups (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.leads(id) on delete cascade,
  quote_request_id uuid references public.quote_requests(id) on delete cascade,
  followup_type text,
  content text,
  next_follow_up_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now(),
  constraint lead_followups_has_parent check (lead_id is not null or quote_request_id is not null)
);

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

drop trigger if exists touch_site_settings_updated_at on public.site_settings;
create trigger touch_site_settings_updated_at
before update on public.site_settings
for each row execute function public.touch_updated_at();

alter table public.site_settings enable row level security;
alter table public.lead_followups enable row level security;
alter table public.admin_audit_logs enable row level security;

drop policy if exists "Public can read site settings" on public.site_settings;
create policy "Public can read site settings"
on public.site_settings for select
using (id = 'default');

drop policy if exists "Admins can manage site settings" on public.site_settings;
create policy "Admins can manage site settings"
on public.site_settings for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can manage lead followups" on public.lead_followups;
create policy "Admins can manage lead followups"
on public.lead_followups for all
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

insert into public.site_settings (
  id,
  company_name,
  brand_name,
  ssm_number,
  email,
  phone_display,
  phone_e164,
  whatsapp_number,
  address_zh,
  address_en,
  short_address_zh,
  short_address_en,
  default_seo_title_zh,
  default_seo_title_en,
  default_seo_description_zh,
  default_seo_description_en
) values (
  'default',
  'FLASH CAST SDN. BHD.',
  'FLASH CAST',
  '202501027419 (1628831-M)',
  'flashcast001@gmail.com',
  '+60 11-2885 3888',
  '+601128853888',
  '601128853888',
  '94, Jalan Mega Mendung, Taman United, 58200 Kuala Lumpur, Malaysia',
  '94, Jalan Mega Mendung, Taman United, 58200 Kuala Lumpur, Malaysia',
  '94, Jalan Mega Mendung, 58200',
  '94, Jalan Mega Mendung, 58200',
  '吉隆坡装修公司 | FLASH CAST',
  'Renovation Company Kuala Lumpur | FLASH CAST',
  'FLASH CAST 提供吉隆坡与雪兰莪住宅、商业空间、厨房、旧屋翻新和定制家具装修服务。',
  'FLASH CAST provides renovation, interior design, custom built-in furniture, and commercial fit-out services in Kuala Lumpur and Selangor.'
) on conflict (id) do nothing;
