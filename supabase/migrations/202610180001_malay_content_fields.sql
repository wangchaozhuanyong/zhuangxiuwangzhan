-- Additive only: preserve all existing bilingual content, IDs, versions, status,
-- RLS policies and publication permissions. Apply before deploying Malay readers.
-- Malay fields remain NULL until explicitly translated and reviewed.
begin;

do $migration$
declare
  source_column record;
begin
  for source_column in
    select c.relname as table_name, a.attname as column_name,
           pg_catalog.format_type(a.atttypid, a.atttypmod) as column_type
      from pg_catalog.pg_attribute a
      join pg_catalog.pg_class c on c.oid = a.attrelid
      join pg_catalog.pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public' and c.relkind = 'r'
       and c.relname = any(array[
         'services', 'projects', 'project_images', 'blog_posts', 'materials',
         'material_images', 'testimonials', 'hero_slides', 'service_areas',
         'landing_pages', 'home_sections', 'about_sections', 'faqs',
         'cta_blocks', 'site_pages', 'cms_pages', 'cms_sections',
         'cms_content_entries', 'cms_section_templates', 'before_after_items', 'process_steps'
       ])
       and a.attnum > 0 and not a.attisdropped and a.attname like '%\_en' escape '\'
       and exists (
         select 1 from pg_catalog.pg_attribute z
          where z.attrelid = a.attrelid and not z.attisdropped
            and z.attname = regexp_replace(a.attname, '_en$', '_zh')
       )
  loop
    execute format('alter table public.%I add column if not exists %I %s',
      source_column.table_name, regexp_replace(source_column.column_name, '_en$', '_ms'), source_column.column_type);
  end loop;
end;
$migration$;

alter table public.translation_jobs
  add column if not exists target_language text not null default 'en'
  check (target_language in ('en', 'ms'));

-- Keep the existing atomic content writers and gallery replacement compatible
-- with the new columns. CREATE OR REPLACE preserves their existing grants.

create or replace function public.publish_material_atomic(
  p_material_id uuid, p_expected_updated_at timestamptz, p_payload jsonb,
  p_images jsonb, p_admin_user_id uuid, p_action text
) returns jsonb language plpgsql security definer set search_path = pg_catalog, public as $$
declare
  v_before jsonb; v_saved jsonb; v_gallery_before jsonb := '[]'; v_gallery_saved jsonb := '[]';
  v_columns text; v_values text; v_updates text; v_id uuid; v_revision timestamptz;
  v_allowed text[] := array['slug','title_zh','title_en','excerpt_zh','excerpt_en','content_zh','content_en','category','subcategory','material_type','color','texture','suitable_spaces_zh','suitable_spaces_en','pros_zh','pros_en','cons_zh','cons_en','recommended_pairing_zh','recommended_pairing_en','note_zh','note_en','reference_price','price_mode','price_min','price_max','price_currency','price_unit','price_scope_zh','price_scope_en','price_note_zh','price_note_en','related_project_ids','image_url','alt_zh','alt_en','seo_title_zh','seo_title_en','seo_description_zh','seo_description_en','status','sort_order','title_ms','excerpt_ms','content_ms','suitable_spaces_ms','pros_ms','cons_ms','recommended_pairing_ms','note_ms','price_scope_ms','price_note_ms','alt_ms','seo_title_ms','seo_description_ms'];
begin
  if jsonb_typeof(p_payload) is distinct from 'object' or p_payload = '{}'::jsonb
      or exists (select 1 from jsonb_object_keys(p_payload) k where not (k = any(v_allowed))) then
    raise exception 'Invalid material fields' using errcode = '22023';
  end if;
  if p_action not in ('insert','update','publish') then raise exception 'Invalid action' using errcode = '22023'; end if;
  -- Also prevents an existing legacy gallery writer from interleaving a replacement.
  lock table public.material_images in share row exclusive mode;
  if p_material_id is not null then
    select to_jsonb(m) into v_before from public.materials m where id = p_material_id for update;
    if v_before is null or p_expected_updated_at is null
        or (v_before->>'updated_at')::timestamptz is distinct from p_expected_updated_at then
      raise exception 'Material version conflict' using errcode = '40001';
    end if;
  end if;
  select string_agg(format('%I', k), ', ' order by k),
    string_agg(format('r.%I', k), ', ' order by k),
    string_agg(format('%I = r.%I', k, k), ', ' order by k)
  into v_columns, v_values, v_updates from jsonb_object_keys(p_payload) k;
  if p_material_id is null then
    execute format('insert into public.materials (%s) select %s from jsonb_populate_record(null::public.materials, $1) r returning to_jsonb(materials.*)', v_columns, v_values)
      into v_saved using p_payload;
  else
    execute format('update public.materials m set %s from jsonb_populate_record(null::public.materials, $1) r where m.id=$2 and m.updated_at=$3 returning to_jsonb(m.*)', v_updates)
      into v_saved using p_payload, p_material_id, p_expected_updated_at;
    if v_saved is null then raise exception 'Material version conflict' using errcode = '40001'; end if;
  end if;
  v_id := (v_saved->>'id')::uuid;
  if p_images is not null then
    if jsonb_typeof(p_images) is distinct from 'array' then raise exception 'Invalid gallery' using errcode = '22023'; end if;
    select coalesce(jsonb_agg(to_jsonb(i) order by i.sort_order, i.id), '[]'::jsonb)
      into v_gallery_before from public.material_images i where material_id = v_id;
    select coalesce(jsonb_agg(to_jsonb(i) order by i.sort_order, i.id), '[]'::jsonb)
      into v_gallery_saved from public.replace_material_gallery(v_id, p_images) i;
  end if;
  -- Gallery triggers may advance the parent; return/audit its final committed version.
  select to_jsonb(m) into v_saved from public.materials m where id=v_id;
  insert into public.admin_audit_logs(admin_user_id, action, table_name, record_id, old_value, new_value)
    values(p_admin_user_id, p_action, 'materials', v_id::text, v_before, v_saved);
  if p_images is not null then
    insert into public.admin_audit_logs(admin_user_id, action, table_name, record_id, old_value, new_value)
      values(p_admin_user_id, 'replace_material_gallery', 'material_images', v_id::text, v_gallery_before, v_gallery_saved);
  end if;
  update public.site_settings set updated_at = clock_timestamp() where id='default' returning updated_at into v_revision;
  if v_revision is null then raise exception 'Public revision is unavailable'; end if;
  return jsonb_build_object('saved', v_saved, 'gallery_count', jsonb_array_length(v_gallery_saved),
    'gallery_archived_count', (select count(*) from jsonb_array_elements(v_gallery_before) i where (i->>'is_active')::boolean is distinct from false),
    'public_revision', v_revision);
end;
$$;

create or replace function public.publish_homepage_record_internal(
  p_table text, p_key text, p_expected_id uuid, p_expected_updated_at timestamptz,
  p_payload jsonb, p_admin_user_id uuid
) returns jsonb language plpgsql security definer set search_path = pg_catalog, public as $$
declare
  v_key_field text; v_allowed text[]; v_before jsonb; v_saved jsonb;
  v_columns text; v_values text; v_updates text; v_count integer;
begin
  if p_table='site_pages' and p_key='home' and p_payload->>'path'='/' then
    v_key_field := 'page_key'; v_allowed := array['page_key','path','title_zh','title_en','subtitle_zh','subtitle_en','description_zh','description_en','content_zh','content_en','cta_title_zh','cta_title_en','cta_description_zh','cta_description_en','image_url','alt_zh','alt_en','seo_title_zh','seo_title_en','seo_description_zh','seo_description_en','seo_keywords_zh','seo_keywords_en','items_zh','items_en','status','sort_order','title_ms','subtitle_ms','description_ms','content_ms','cta_title_ms','cta_description_ms','alt_ms','seo_title_ms','seo_description_ms','seo_keywords_ms','items_ms'];
  elsif p_table='cta_blocks' and p_key='home_final' then
    v_key_field := 'block_key'; v_allowed := array['block_key','title_zh','title_en','description_zh','description_en','primary_label_zh','primary_label_en','primary_url','secondary_label_zh','secondary_label_en','secondary_url','image_url','status','title_ms','description_ms','primary_label_ms','secondary_label_ms'];
  elsif p_table='home_sections' and p_key in ('stats','why_choose_us') then
    v_key_field := 'section_key'; v_allowed := array['section_key','title_zh','title_en','subtitle_zh','subtitle_en','content_zh','content_en','image_url','button_label_zh','button_label_en','button_url','items_zh','items_en','status','sort_order','title_ms','subtitle_ms','content_ms','button_label_ms','items_ms'];
  else raise exception 'Unsupported homepage target' using errcode='22023'; end if;
  if jsonb_typeof(p_payload) is distinct from 'object' or p_payload->>v_key_field is distinct from p_key
      or exists (select 1 from jsonb_object_keys(p_payload) k where not (k=any(v_allowed))) then
    raise exception 'Invalid homepage fields' using errcode='22023';
  end if;
  execute format('select count(*) from public.%I where %I=$1', p_table, v_key_field) into v_count using p_key;
  if v_count>1 then raise exception 'Ambiguous homepage target' using errcode='40001'; end if;
  execute format('select to_jsonb(t) from public.%I t where %I=$1 for update', p_table, v_key_field) into v_before using p_key;
  if (v_before is null and p_expected_id is not null)
    or (v_before is not null and (p_expected_id is null or p_expected_updated_at is null
      or (v_before->>'id')::uuid is distinct from p_expected_id
      or (v_before->>'updated_at')::timestamptz is distinct from p_expected_updated_at)) then
    raise exception 'Homepage version conflict' using errcode='40001';
  end if;
  select string_agg(format('%I', k), ', ' order by k),
    string_agg(format('r.%I', k), ', ' order by k),
    string_agg(format('%I = r.%I', k, k), ', ' order by k)
  into v_columns, v_values, v_updates from jsonb_object_keys(p_payload) k;
  if v_before is null then
    execute format('insert into public.%I (%s) select %s from jsonb_populate_record(null::public.%I,$1) r returning to_jsonb(%I.*)',
      p_table,v_columns,v_values,p_table,p_table) into v_saved using p_payload;
  else
    execute format('update public.%I t set %s from jsonb_populate_record(null::public.%I,$1) r where t.id=$2 and t.updated_at=$3 returning to_jsonb(t.*)',
      p_table,v_updates,p_table) into v_saved using p_payload,p_expected_id,p_expected_updated_at;
    if v_saved is null then raise exception 'Homepage version conflict' using errcode='40001'; end if;
  end if;
  insert into public.admin_audit_logs(admin_user_id,action,table_name,record_id,old_value,new_value)
    values(p_admin_user_id, case when v_before is null then 'homepage_insert' else 'homepage_update' end,
      p_table,v_saved->>'id',v_before,v_saved);
  return jsonb_build_object('table',p_table,'key',p_key,'action',case when v_before is null then 'insert' else 'update' end,
    'saved_id',v_saved->>'id','saved_updated_at',v_saved->>'updated_at');
end;
$$;

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
    alt_ms,
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
    image.alt_ms,
    image.source_url,
    coalesce(image.rights_status, 'owned'),
    coalesce(image.sort_order, 0),
    true
  from jsonb_to_recordset(coalesce(p_images, '[]'::jsonb)) as image(
    image_url text,
    image_type text,
    alt_zh text,
    alt_en text,
    alt_ms text,
    source_url text,
    rights_status text,
    sort_order integer
  )
  returning *;
end;
$$;

notify pgrst, 'reload schema';
commit;
