insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'site-images',
  'site-images',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
set public = true,
    file_size_limit = 10485760,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

drop policy if exists "Public can read site images" on storage.objects;
create policy "Public can read site images"
on storage.objects for select
using (bucket_id = 'site-images');

drop policy if exists "Authenticated admins can upload site images" on storage.objects;
create policy "Authenticated admins can upload site images"
on storage.objects for insert
with check (bucket_id = 'site-images' and auth.role() = 'authenticated');

drop policy if exists "Authenticated admins can update site images" on storage.objects;
create policy "Authenticated admins can update site images"
on storage.objects for update
using (bucket_id = 'site-images' and auth.role() = 'authenticated')
with check (bucket_id = 'site-images' and auth.role() = 'authenticated');

drop policy if exists "Authenticated admins can delete site images" on storage.objects;
create policy "Authenticated admins can delete site images"
on storage.objects for delete
using (bucket_id = 'site-images' and auth.role() = 'authenticated');
