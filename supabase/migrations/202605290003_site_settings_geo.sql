alter table public.site_settings
  add column if not exists map_latitude text,
  add column if not exists map_longitude text;

update public.site_settings
set
  map_latitude = coalesce(map_latitude, '3.0830403'),
  map_longitude = coalesce(map_longitude, '101.6708234')
where id = 'default';
