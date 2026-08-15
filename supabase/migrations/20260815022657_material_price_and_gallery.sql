-- Add language-neutral pricing and a dedicated material gallery while preserving
-- legacy reference_price and image_url fields for backward compatibility.

alter table public.materials
  add column if not exists price_mode text not null default 'none'
    check (price_mode in ('range', 'from', 'specification', 'size', 'scope', 'none')),
  add column if not exists price_min numeric(12, 2),
  add column if not exists price_max numeric(12, 2),
  add column if not exists price_currency text not null default 'MYR'
    check (char_length(price_currency) = 3),
  add column if not exists price_unit text not null default 'none'
    check (price_unit in ('sqft', 'foot_run', 'unit', 'set', 'panel', 'scope', 'none')),
  add column if not exists price_scope_zh text,
  add column if not exists price_scope_en text,
  add column if not exists price_note_zh text,
  add column if not exists price_note_en text;

alter table public.materials
  drop constraint if exists materials_price_values_check;

alter table public.materials
  add constraint materials_price_values_check check (
    (price_min is null or price_min >= 0)
    and (price_max is null or price_max >= 0)
    and (price_min is null or price_max is null or price_max >= price_min)
  );

create table if not exists public.material_images (
  id uuid primary key default gen_random_uuid(),
  material_id uuid not null references public.materials(id) on delete cascade,
  image_url text not null,
  image_type text not null default 'scene'
    check (image_type in ('cover', 'scene', 'detail', 'installation', 'specification')),
  alt_zh text,
  alt_en text,
  source_url text,
  rights_status text not null default 'owned'
    check (rights_status in ('owned', 'generated', 'licensed', 'supplier_approved')),
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists material_images_public_order_idx
  on public.material_images(material_id, is_active, sort_order);

drop trigger if exists touch_material_images_updated_at on public.material_images;
create trigger touch_material_images_updated_at
before update on public.material_images
for each row execute function public.touch_updated_at();

alter table public.material_images enable row level security;

drop policy if exists "Published material images are public" on public.material_images;
create policy "Published material images are public"
on public.material_images for select
using (
  is_active
  and exists (
    select 1
    from public.materials material
    where material.id = material_id
      and material.status = 'published'
  )
);

drop policy if exists "Admin roles can read material images" on public.material_images;
create policy "Admin roles can read material images"
on public.material_images for select
using (public.has_admin_role(array['super_admin', 'content_editor', 'lead_manager', 'viewer']));

drop policy if exists "Content roles can write material images" on public.material_images;
create policy "Content roles can write material images"
on public.material_images for all
using (public.has_admin_role(array['super_admin', 'content_editor']))
with check (public.has_admin_role(array['super_admin', 'content_editor']));

create or replace function public.replace_material_gallery(
  p_material_id uuid,
  p_images jsonb
)
returns setof public.material_images
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.material_images
  set is_active = false
  where material_id = p_material_id
    and is_active = true;

  return query
  insert into public.material_images (
    material_id,
    image_url,
    image_type,
    alt_zh,
    alt_en,
    source_url,
    rights_status,
    sort_order,
    is_active
  )
  select
    p_material_id,
    image.image_url,
    coalesce(image.image_type, 'scene'),
    image.alt_zh,
    image.alt_en,
    image.source_url,
    coalesce(image.rights_status, 'owned'),
    coalesce(image.sort_order, 0),
    true
  from jsonb_to_recordset(coalesce(p_images, '[]'::jsonb)) as image(
    image_url text,
    image_type text,
    alt_zh text,
    alt_en text,
    source_url text,
    rights_status text,
    sort_order integer
  )
  returning *;
end;
$$;

revoke all on function public.replace_material_gallery(uuid, jsonb) from public, anon, authenticated;
grant execute on function public.replace_material_gallery(uuid, jsonb) to service_role;
