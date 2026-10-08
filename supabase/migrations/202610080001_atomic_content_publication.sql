-- Local additive migration: finite service-role-only publication transactions.
-- Apply before the new content-publish caller. Do not fall back to partial writes.
-- Existing row timestamps remain exact timestamptz values, never JS millisecond projections.
-- The parent version represents both material fields and its gallery. Otherwise
-- an independent admin gallery edit would be invisible to a later main-row CAS.
create or replace function public.touch_material_parent_revision()
returns trigger language plpgsql security definer set search_path = pg_catalog, public as $$
declare
  v_old_parent uuid; v_new_parent uuid; v_parent uuid;
begin
  if tg_op <> 'INSERT' then v_old_parent := old.material_id; end if;
  if tg_op <> 'DELETE' then v_new_parent := new.material_id; end if;
  -- Re-parenting uses a stable lock order; cascaded deletion safely matches no parent.
  for v_parent in select distinct parent_id from unnest(array[v_old_parent,v_new_parent]) parent_id
      where parent_id is not null order by parent_id loop
    update public.materials set updated_at=clock_timestamp() where id=v_parent;
  end loop;
  if tg_op='DELETE' then return old; end if;
  return new;
end;
$$;
revoke all on function public.touch_material_parent_revision() from public, anon, authenticated, service_role;
drop trigger if exists touch_material_gallery_parent_revision on public.material_images;
create trigger touch_material_gallery_parent_revision after insert or update or delete on public.material_images
for each row execute function public.touch_material_parent_revision();

create or replace function public.publish_material_atomic(
  p_material_id uuid, p_expected_updated_at timestamptz, p_payload jsonb,
  p_images jsonb, p_admin_user_id uuid, p_action text
) returns jsonb language plpgsql security definer set search_path = pg_catalog, public as $$
declare
  v_before jsonb; v_saved jsonb; v_gallery_before jsonb := '[]'; v_gallery_saved jsonb := '[]';
  v_columns text; v_values text; v_updates text; v_id uuid; v_revision timestamptz;
  v_allowed text[] := array['slug','title_zh','title_en','excerpt_zh','excerpt_en','content_zh','content_en','category','subcategory','material_type','color','texture','suitable_spaces_zh','suitable_spaces_en','pros_zh','pros_en','cons_zh','cons_en','recommended_pairing_zh','recommended_pairing_en','note_zh','note_en','reference_price','price_mode','price_min','price_max','price_currency','price_unit','price_scope_zh','price_scope_en','price_note_zh','price_note_en','related_project_ids','image_url','alt_zh','alt_en','seo_title_zh','seo_title_en','seo_description_zh','seo_description_en','status','sort_order'];
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
revoke all on function public.publish_material_atomic(uuid,timestamptz,jsonb,jsonb,uuid,text) from public, anon, authenticated;
grant execute on function public.publish_material_atomic(uuid,timestamptz,jsonb,jsonb,uuid,text) to service_role;

-- Internal helper: only the owning transaction may call it. Its table and key
-- choices are fixed; it is deliberately not granted to any API/database role.
create or replace function public.publish_homepage_record_internal(
  p_table text, p_key text, p_expected_id uuid, p_expected_updated_at timestamptz,
  p_payload jsonb, p_admin_user_id uuid
) returns jsonb language plpgsql security definer set search_path = pg_catalog, public as $$
declare
  v_key_field text; v_allowed text[]; v_before jsonb; v_saved jsonb;
  v_columns text; v_values text; v_updates text; v_count integer;
begin
  if p_table='site_pages' and p_key='home' and p_payload->>'path'='/' then
    v_key_field := 'page_key'; v_allowed := array['page_key','path','title_zh','title_en','subtitle_zh','subtitle_en','description_zh','description_en','content_zh','content_en','cta_title_zh','cta_title_en','cta_description_zh','cta_description_en','image_url','alt_zh','alt_en','seo_title_zh','seo_title_en','seo_description_zh','seo_description_en','seo_keywords_zh','seo_keywords_en','items_zh','items_en','status','sort_order'];
  elsif p_table='cta_blocks' and p_key='home_final' then
    v_key_field := 'block_key'; v_allowed := array['block_key','title_zh','title_en','description_zh','description_en','primary_label_zh','primary_label_en','primary_url','secondary_label_zh','secondary_label_en','secondary_url','image_url','status'];
  elsif p_table='home_sections' and p_key in ('stats','why_choose_us') then
    v_key_field := 'section_key'; v_allowed := array['section_key','title_zh','title_en','subtitle_zh','subtitle_en','content_zh','content_en','image_url','button_label_zh','button_label_en','button_url','items_zh','items_en','status','sort_order'];
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
revoke all on function public.publish_homepage_record_internal(text,text,uuid,timestamptz,jsonb,uuid) from public, anon, authenticated, service_role;

create or replace function public.publish_homepage_atomic(
  p_site_page jsonb, p_cta_blocks jsonb, p_home_sections jsonb,
  p_faqs jsonb, p_replace_faqs boolean, p_expected_faqs jsonb, p_admin_user_id uuid
) returns jsonb language plpgsql security definer set search_path = pg_catalog, public as $$
declare
  v_item jsonb; v_saved_records jsonb := '[]'; v_old_faqs jsonb; v_archived jsonb; v_inserted jsonb;
  v_revision timestamptz; v_result jsonb;
begin
  if jsonb_typeof(p_cta_blocks) is distinct from 'array' or jsonb_typeof(p_home_sections) is distinct from 'array'
    or jsonb_typeof(p_faqs) is distinct from 'array' then raise exception 'Invalid homepage arrays' using errcode='22023'; end if;
  -- Lock in a fixed order, including inserts/phantoms from older callers. This
  -- is a bounded, infrequent publishing transaction, never an arbitrary table RPC.
  lock table public.site_pages, public.cta_blocks, public.home_sections, public.faqs in share row exclusive mode;
  if p_site_page is not null then
    v_result := public.publish_homepage_record_internal('site_pages',p_site_page->>'key',
      (p_site_page->>'expectedId')::uuid,(p_site_page->>'expectedUpdatedAt')::timestamptz,p_site_page->'payload',p_admin_user_id);
    v_saved_records := v_saved_records || jsonb_build_array(v_result);
  end if;
  for v_item in select value from jsonb_array_elements(p_cta_blocks) loop
    v_result := public.publish_homepage_record_internal('cta_blocks',v_item->>'key',
      (v_item->>'expectedId')::uuid,(v_item->>'expectedUpdatedAt')::timestamptz,v_item->'payload',p_admin_user_id);
    v_saved_records := v_saved_records || jsonb_build_array(v_result);
  end loop;
  for v_item in select value from jsonb_array_elements(p_home_sections) loop
    v_result := public.publish_homepage_record_internal('home_sections',v_item->>'key',
      (v_item->>'expectedId')::uuid,(v_item->>'expectedUpdatedAt')::timestamptz,v_item->'payload',p_admin_user_id);
    v_saved_records := v_saved_records || jsonb_build_array(v_result);
  end loop;
  if jsonb_array_length(p_faqs)>0 then
    select coalesce(jsonb_agg(to_jsonb(f) order by f.id),'[]'::jsonb) into v_old_faqs
      from public.faqs f where page_key='home' and status='published';
    if p_replace_faqs then
      if jsonb_typeof(p_expected_faqs) is distinct from 'array'
        or jsonb_array_length(p_expected_faqs) is distinct from jsonb_array_length(v_old_faqs)
        or exists (select 1 from public.faqs f where page_key='home' and status='published' and not exists
          (select 1 from jsonb_to_recordset(p_expected_faqs) e(id uuid,updated_at timestamptz) where e.id=f.id and e.updated_at=f.updated_at)) then
        raise exception 'Homepage FAQ version conflict' using errcode='40001';
      end if;
      with archived as (update public.faqs set status='archived' where page_key='home' and status='published' returning *)
        select coalesce(jsonb_agg(to_jsonb(a)),'[]'::jsonb) into v_archived from archived a;
      insert into public.admin_audit_logs(admin_user_id,action,table_name,old_value,new_value)
        values(p_admin_user_id,'homepage_archive_existing_faqs','faqs',v_old_faqs,v_archived);
      v_saved_records := v_saved_records || jsonb_build_array(jsonb_build_object('table','faqs','key','home','action','archive_existing','archived_count',jsonb_array_length(v_archived)));
    end if;
    if exists (select 1 from jsonb_array_elements(p_faqs) f where f->>'page_key' is distinct from 'home'
      or jsonb_typeof(f) is distinct from 'object'
      or exists (select 1 from jsonb_object_keys(f) k where not (k=any(array['page_key','question_zh','question_en','answer_zh','answer_en','status','sort_order'])))) then
      raise exception 'Invalid homepage FAQs' using errcode='22023';
    end if;
    with inserted as (insert into public.faqs(page_key,question_zh,question_en,answer_zh,answer_en,status,sort_order)
      select page_key,question_zh,question_en,answer_zh,answer_en,status,sort_order
      from jsonb_populate_recordset(null::public.faqs,p_faqs) returning *)
      select coalesce(jsonb_agg(to_jsonb(i)),'[]'::jsonb) into v_inserted from inserted i;
    insert into public.admin_audit_logs(admin_user_id,action,table_name,old_value,new_value)
      values(p_admin_user_id,'homepage_insert_faqs','faqs',v_archived,v_inserted);
    v_saved_records := v_saved_records || jsonb_build_array(jsonb_build_object('table','faqs','key','home','action','insert','inserted_count',jsonb_array_length(v_inserted)));
  end if;
  update public.site_settings set updated_at=clock_timestamp() where id='default' returning updated_at into v_revision;
  if v_revision is null then raise exception 'Public revision is unavailable'; end if;
  return jsonb_build_object('saved_records',v_saved_records,'public_revision',v_revision);
end;
$$;
revoke all on function public.publish_homepage_atomic(jsonb,jsonb,jsonb,jsonb,boolean,jsonb,uuid) from public, anon, authenticated;
grant execute on function public.publish_homepage_atomic(jsonb,jsonb,jsonb,jsonb,boolean,jsonb,uuid) to service_role;
