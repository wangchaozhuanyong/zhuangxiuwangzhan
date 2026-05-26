create extension if not exists pgcrypto;

create type public.content_status as enum ('draft', 'published', 'archived');
create type public.lead_status as enum ('new', 'contacted', 'quoted', 'converted', 'closed');
create type public.quote_status as enum ('pending', 'site_visit_scheduled', 'quoted', 'accepted', 'rejected');
create type public.translation_status as enum ('queued', 'processing', 'completed', 'failed');

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title_zh text,
  title_en text,
  excerpt_zh text,
  excerpt_en text,
  content_zh text,
  content_en text,
  location text,
  area text,
  duration text,
  budget text,
  project_type text,
  materials text[] default '{}',
  scope text[] default '{}',
  highlights_zh text[] default '{}',
  highlights_en text[] default '{}',
  client_need_zh text,
  client_need_en text,
  seo_title_zh text,
  seo_title_en text,
  seo_description_zh text,
  seo_description_en text,
  status public.content_status default 'draft',
  sort_order integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.project_images (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade,
  image_url text not null,
  image_type text default 'gallery' check (image_type in ('gallery', 'before', 'after', 'cover')),
  alt_zh text,
  alt_en text,
  sort_order integer default 0,
  created_at timestamptz default now()
);

create table public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title_zh text,
  title_en text,
  excerpt_zh text,
  excerpt_en text,
  content_zh text,
  content_en text,
  category text,
  tags text[] default '{}',
  cover_image_url text,
  alt_zh text,
  alt_en text,
  seo_title_zh text,
  seo_title_en text,
  seo_description_zh text,
  seo_description_en text,
  status public.content_status default 'draft',
  published_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.materials (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title_zh text,
  title_en text,
  excerpt_zh text,
  excerpt_en text,
  content_zh text,
  content_en text,
  category text,
  suitable_spaces_zh text[] default '{}',
  suitable_spaces_en text[] default '{}',
  pros_zh text[] default '{}',
  pros_en text[] default '{}',
  cons_zh text[] default '{}',
  cons_en text[] default '{}',
  reference_price text,
  related_project_ids uuid[] default '{}',
  image_url text,
  alt_zh text,
  alt_en text,
  seo_title_zh text,
  seo_title_en text,
  seo_description_zh text,
  seo_description_en text,
  status public.content_status default 'draft',
  sort_order integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.testimonials (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete set null,
  customer_name text,
  rating integer default 5 check (rating between 1 and 5),
  content_zh text,
  content_en text,
  status public.content_status default 'draft',
  sort_order integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.hero_slides (
  id uuid primary key default gen_random_uuid(),
  title_zh text,
  title_en text,
  excerpt_zh text,
  excerpt_en text,
  button_label_zh text,
  button_label_en text,
  button_url text,
  image_url text,
  alt_zh text,
  alt_en text,
  status public.content_status default 'draft',
  sort_order integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.service_areas (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title_zh text,
  title_en text,
  excerpt_zh text,
  excerpt_en text,
  content_zh text,
  content_en text,
  area_name text,
  seo_title_zh text,
  seo_title_en text,
  seo_description_zh text,
  seo_description_en text,
  status public.content_status default 'draft',
  sort_order integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  email text,
  project_type text,
  location text,
  message text not null,
  source text default 'website',
  source_path text,
  status public.lead_status default 'new',
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.quote_requests (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.leads(id) on delete set null,
  customer_name text not null,
  customer_phone text not null,
  customer_email text,
  project_type text not null,
  location text not null,
  property_size text,
  project_details text,
  attachments text[] default '{}',
  estimated_budget text,
  quoted_amount numeric,
  valid_until date,
  source_path text,
  status public.quote_status default 'pending',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.translation_jobs (
  id uuid primary key default gen_random_uuid(),
  table_name text not null,
  record_id uuid not null,
  status public.translation_status default 'queued',
  error_message text,
  regenerated_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger touch_projects_updated_at before update on public.projects for each row execute function public.touch_updated_at();
create trigger touch_blog_posts_updated_at before update on public.blog_posts for each row execute function public.touch_updated_at();
create trigger touch_materials_updated_at before update on public.materials for each row execute function public.touch_updated_at();
create trigger touch_testimonials_updated_at before update on public.testimonials for each row execute function public.touch_updated_at();
create trigger touch_hero_slides_updated_at before update on public.hero_slides for each row execute function public.touch_updated_at();
create trigger touch_service_areas_updated_at before update on public.service_areas for each row execute function public.touch_updated_at();
create trigger touch_leads_updated_at before update on public.leads for each row execute function public.touch_updated_at();
create trigger touch_quote_requests_updated_at before update on public.quote_requests for each row execute function public.touch_updated_at();
create trigger touch_translation_jobs_updated_at before update on public.translation_jobs for each row execute function public.touch_updated_at();

alter table public.projects enable row level security;
alter table public.project_images enable row level security;
alter table public.blog_posts enable row level security;
alter table public.materials enable row level security;
alter table public.testimonials enable row level security;
alter table public.hero_slides enable row level security;
alter table public.service_areas enable row level security;
alter table public.leads enable row level security;
alter table public.quote_requests enable row level security;
alter table public.translation_jobs enable row level security;

create policy "Published projects are public" on public.projects for select using (status = 'published');
create policy "Published project images are public" on public.project_images for select using (exists (select 1 from public.projects p where p.id = project_id and p.status = 'published'));
create policy "Published blog posts are public" on public.blog_posts for select using (status = 'published');
create policy "Published materials are public" on public.materials for select using (status = 'published');
create policy "Published testimonials are public" on public.testimonials for select using (status = 'published');
create policy "Published hero slides are public" on public.hero_slides for select using (status = 'published');
create policy "Published service areas are public" on public.service_areas for select using (status = 'published');

create policy "Authenticated admins can manage projects" on public.projects for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Authenticated admins can manage project images" on public.project_images for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Authenticated admins can manage blog posts" on public.blog_posts for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Authenticated admins can manage materials" on public.materials for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Authenticated admins can manage testimonials" on public.testimonials for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Authenticated admins can manage hero slides" on public.hero_slides for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Authenticated admins can manage service areas" on public.service_areas for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Authenticated admins can manage leads" on public.leads for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Authenticated admins can manage quote requests" on public.quote_requests for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Authenticated admins can manage translation jobs" on public.translation_jobs for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "Website can submit leads" on public.leads for insert with check (true);
create policy "Website can submit quote requests" on public.quote_requests for insert with check (true);
