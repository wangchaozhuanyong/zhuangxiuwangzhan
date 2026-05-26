create table if not exists public.landing_pages (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title_zh text,
  title_en text,
  excerpt_zh text,
  excerpt_en text,
  content_zh text,
  content_en text,
  hero_image_url text,
  alt_zh text,
  alt_en text,
  benefits_zh text[] default '{}',
  benefits_en text[] default '{}',
  related_projects jsonb default '[]'::jsonb,
  faqs_zh jsonb default '[]'::jsonb,
  faqs_en jsonb default '[]'::jsonb,
  seo_title_zh text,
  seo_title_en text,
  seo_description_zh text,
  seo_description_en text,
  status public.content_status default 'draft',
  sort_order integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

drop trigger if exists touch_landing_pages_updated_at on public.landing_pages;
create trigger touch_landing_pages_updated_at before update on public.landing_pages for each row execute function public.touch_updated_at();

alter table public.landing_pages enable row level security;

drop policy if exists "Published landing pages are public" on public.landing_pages;
create policy "Published landing pages are public" on public.landing_pages for select using (status = 'published');

drop policy if exists "Admins can manage landing pages" on public.landing_pages;
create policy "Admins can manage landing pages" on public.landing_pages for all using (public.is_admin()) with check (public.is_admin());
