-- Media upload automation:
-- - keep original image/video metadata
-- - store generated video posters
-- - provide a public video bucket while keeping image originals private

alter table public.media_assets add column if not exists poster_url text;
alter table public.media_assets add column if not exists duration_seconds numeric;
alter table public.media_assets add column if not exists original_file_path text;
alter table public.media_assets add column if not exists original_mime_type text;
alter table public.media_assets add column if not exists original_size_bytes bigint;
alter table public.media_assets add column if not exists original_width integer;
alter table public.media_assets add column if not exists original_height integer;
alter table public.media_assets add column if not exists processing_status text not null default 'ready';
alter table public.media_assets add column if not exists processing_notes jsonb not null default '[]'::jsonb;

create index if not exists media_assets_usage_created_idx on public.media_assets(usage_type, created_at desc);
create index if not exists media_assets_mime_created_idx on public.media_assets(mime_type, created_at desc);
create index if not exists media_assets_processing_status_idx on public.media_assets(processing_status, created_at desc);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'site-media-originals',
  'site-media-originals',
  false,
  52428800,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'site-videos',
  'site-videos',
  true,
  104857600,
  array['video/mp4', 'video/webm', 'video/quicktime']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Content roles can read original media" on storage.objects;
create policy "Content roles can read original media"
on storage.objects for select
using (bucket_id = 'site-media-originals' and public.has_admin_role(array['super_admin', 'content_editor']));

drop policy if exists "Content roles can upload original media" on storage.objects;
create policy "Content roles can upload original media"
on storage.objects for insert
with check (bucket_id = 'site-media-originals' and public.has_admin_role(array['super_admin', 'content_editor']));

drop policy if exists "Content roles can update original media" on storage.objects;
create policy "Content roles can update original media"
on storage.objects for update
using (bucket_id = 'site-media-originals' and public.has_admin_role(array['super_admin', 'content_editor']))
with check (bucket_id = 'site-media-originals' and public.has_admin_role(array['super_admin', 'content_editor']));

drop policy if exists "Content roles can delete original media" on storage.objects;
create policy "Content roles can delete original media"
on storage.objects for delete
using (bucket_id = 'site-media-originals' and public.has_admin_role(array['super_admin', 'content_editor']));

drop policy if exists "Public can read site videos" on storage.objects;
create policy "Public can read site videos"
on storage.objects for select
using (bucket_id = 'site-videos');

drop policy if exists "Content roles can upload site videos" on storage.objects;
create policy "Content roles can upload site videos"
on storage.objects for insert
with check (bucket_id = 'site-videos' and public.has_admin_role(array['super_admin', 'content_editor']));

drop policy if exists "Content roles can update site videos" on storage.objects;
create policy "Content roles can update site videos"
on storage.objects for update
using (bucket_id = 'site-videos' and public.has_admin_role(array['super_admin', 'content_editor']))
with check (bucket_id = 'site-videos' and public.has_admin_role(array['super_admin', 'content_editor']));

drop policy if exists "Content roles can delete site videos" on storage.objects;
create policy "Content roles can delete site videos"
on storage.objects for delete
using (bucket_id = 'site-videos' and public.has_admin_role(array['super_admin', 'content_editor']));
