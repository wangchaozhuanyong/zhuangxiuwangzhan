create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title_zh text,
  title_en text,
  excerpt_zh text,
  excerpt_en text,
  content_zh text,
  content_en text,
  image_url text,
  alt_zh text,
  alt_en text,
  suitable_for_zh text[] default '{}',
  suitable_for_en text[] default '{}',
  common_projects_zh text[] default '{}',
  common_projects_en text[] default '{}',
  process_steps_zh jsonb default '[]'::jsonb,
  process_steps_en jsonb default '[]'::jsonb,
  scope_items_zh text[] default '{}',
  scope_items_en text[] default '{}',
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

alter table public.services enable row level security;

drop policy if exists "Published services are public" on public.services;
create policy "Published services are public" on public.services for select using (status = 'published');

drop policy if exists "Authenticated admins can manage services" on public.services;
create policy "Authenticated admins can manage services" on public.services for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop trigger if exists touch_services_updated_at on public.services;
create trigger touch_services_updated_at before update on public.services for each row execute function public.touch_updated_at();
