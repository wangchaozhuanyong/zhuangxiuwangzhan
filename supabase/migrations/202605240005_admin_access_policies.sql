create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false)
    or exists (
      select 1
      from public.admin_users
      where user_id = auth.uid()
        and active = true
    );
$$;

drop policy if exists "Admins can read admin users" on public.admin_users;
create policy "Admins can read admin users"
on public.admin_users for select
using (public.is_admin());

drop policy if exists "Admins can manage admin users" on public.admin_users;
create policy "Admins can manage admin users"
on public.admin_users for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Authenticated admins can manage projects" on public.projects;
create policy "Admins can manage projects" on public.projects for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Authenticated admins can manage project images" on public.project_images;
create policy "Admins can manage project images" on public.project_images for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Authenticated admins can manage blog posts" on public.blog_posts;
create policy "Admins can manage blog posts" on public.blog_posts for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Authenticated admins can manage materials" on public.materials;
create policy "Admins can manage materials" on public.materials for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Authenticated admins can manage testimonials" on public.testimonials;
create policy "Admins can manage testimonials" on public.testimonials for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Authenticated admins can manage hero slides" on public.hero_slides;
create policy "Admins can manage hero slides" on public.hero_slides for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Authenticated admins can manage service areas" on public.service_areas;
create policy "Admins can manage service areas" on public.service_areas for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Authenticated admins can manage leads" on public.leads;
create policy "Admins can manage leads" on public.leads for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Authenticated admins can manage quote requests" on public.quote_requests;
create policy "Admins can manage quote requests" on public.quote_requests for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Authenticated admins can manage translation jobs" on public.translation_jobs;
create policy "Admins can manage translation jobs" on public.translation_jobs for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Authenticated admins can manage services" on public.services;
create policy "Admins can manage services" on public.services for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Authenticated admins can upload site images" on storage.objects;
create policy "Admins can upload site images"
on storage.objects for insert
with check (bucket_id = 'site-images' and public.is_admin());

drop policy if exists "Authenticated admins can update site images" on storage.objects;
create policy "Admins can update site images"
on storage.objects for update
using (bucket_id = 'site-images' and public.is_admin())
with check (bucket_id = 'site-images' and public.is_admin());

drop policy if exists "Authenticated admins can delete site images" on storage.objects;
create policy "Admins can delete site images"
on storage.objects for delete
using (bucket_id = 'site-images' and public.is_admin());
