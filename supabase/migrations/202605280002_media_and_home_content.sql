create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  file_url text not null,
  file_path text,
  file_name text,
  mime_type text,
  size_bytes bigint,
  width integer,
  height integer,
  folder text,
  alt_zh text,
  alt_en text,
  usage_type text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now()
);

create table if not exists public.home_sections (
  id uuid primary key default gen_random_uuid(),
  section_key text not null,
  title_zh text,
  title_en text,
  subtitle_zh text,
  subtitle_en text,
  content_zh text,
  content_en text,
  image_url text,
  button_label_zh text,
  button_label_en text,
  button_url text,
  items_zh jsonb default '[]'::jsonb,
  items_en jsonb default '[]'::jsonb,
  status public.content_status default 'published',
  sort_order integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.faqs (
  id uuid primary key default gen_random_uuid(),
  page_key text default 'general',
  question_zh text,
  question_en text,
  answer_zh text,
  answer_en text,
  status public.content_status default 'published',
  sort_order integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.before_after_items (
  id uuid primary key default gen_random_uuid(),
  title_zh text,
  title_en text,
  location text,
  description_zh text,
  description_en text,
  before_image_url text,
  after_image_url text,
  alt_zh text,
  alt_en text,
  status public.content_status default 'published',
  sort_order integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.brand_partners (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  logo_url text not null,
  website_url text,
  status public.content_status default 'published',
  sort_order integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

drop trigger if exists touch_home_sections_updated_at on public.home_sections;
create trigger touch_home_sections_updated_at before update on public.home_sections for each row execute function public.touch_updated_at();

drop trigger if exists touch_faqs_updated_at on public.faqs;
create trigger touch_faqs_updated_at before update on public.faqs for each row execute function public.touch_updated_at();

drop trigger if exists touch_before_after_items_updated_at on public.before_after_items;
create trigger touch_before_after_items_updated_at before update on public.before_after_items for each row execute function public.touch_updated_at();

drop trigger if exists touch_brand_partners_updated_at on public.brand_partners;
create trigger touch_brand_partners_updated_at before update on public.brand_partners for each row execute function public.touch_updated_at();

alter table public.media_assets enable row level security;
alter table public.home_sections enable row level security;
alter table public.faqs enable row level security;
alter table public.before_after_items enable row level security;
alter table public.brand_partners enable row level security;

create policy "Public can read media assets" on public.media_assets for select using (true);
create policy "Admins can manage media assets" on public.media_assets for all using (public.is_admin()) with check (public.is_admin());

create policy "Public can read published home sections" on public.home_sections for select using (status = 'published');
create policy "Admins can manage home sections" on public.home_sections for all using (public.is_admin()) with check (public.is_admin());

create policy "Public can read published faqs" on public.faqs for select using (status = 'published');
create policy "Admins can manage faqs" on public.faqs for all using (public.is_admin()) with check (public.is_admin());

create policy "Public can read published before after items" on public.before_after_items for select using (status = 'published');
create policy "Admins can manage before after items" on public.before_after_items for all using (public.is_admin()) with check (public.is_admin());

create policy "Public can read published brand partners" on public.brand_partners for select using (status = 'published');
create policy "Admins can manage brand partners" on public.brand_partners for all using (public.is_admin()) with check (public.is_admin());
