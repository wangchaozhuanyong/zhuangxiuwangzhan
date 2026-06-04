create or replace function public.get_public_home_bundle()
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  select jsonb_build_object(
    'site_pages',
      coalesce((
        select jsonb_agg(to_jsonb(sp))
        from (
          select *
          from public.site_pages
          where status = 'published'
            and page_key = 'home'
          order by sort_order
          limit 1
        ) sp
      ), '[]'::jsonb),
    'cms_pages',
      coalesce((
        select jsonb_agg(
          to_jsonb(cp) ||
          jsonb_build_object(
            'cms_sections',
            coalesce((
              select jsonb_agg(to_jsonb(cs) order by cs.sort_order)
              from public.cms_sections cs
              where cs.page_id = cp.id
                and cs.status = 'published'
                and cs.deleted_at is null
            ), '[]'::jsonb)
          )
        )
        from (
          select *
          from public.cms_pages
          where status = 'published'
            and deleted_at is null
            and page_key = 'home'
          order by sort_order
          limit 1
        ) cp
      ), '[]'::jsonb),
    'hero_slides',
      coalesce((
        select jsonb_agg(to_jsonb(hs) order by hs.sort_order)
        from public.hero_slides hs
        where hs.status = 'published'
      ), '[]'::jsonb),
    'home_sections',
      coalesce((
        select jsonb_agg(to_jsonb(hs) order by hs.sort_order)
        from public.home_sections hs
        where hs.status = 'published'
          and hs.section_key in ('stats', 'why_choose_us')
      ), '[]'::jsonb),
    'projects',
      coalesce((
        select jsonb_agg(to_jsonb(project_rows) order by project_rows.sort_order)
        from (
          select
            p.*,
            coalesce((
              select jsonb_agg(to_jsonb(pi) order by pi.sort_order)
              from public.project_images pi
              where pi.project_id = p.id
            ), '[]'::jsonb) as project_images
          from public.projects p
          where p.status = 'published'
          order by p.sort_order
          limit 6
        ) project_rows
      ), '[]'::jsonb),
    'brand_partners',
      coalesce((
        select jsonb_agg(to_jsonb(bp) order by bp.sort_order)
        from public.brand_partners bp
        where bp.status = 'published'
      ), '[]'::jsonb),
    'services',
      coalesce((
        select jsonb_agg(to_jsonb(s) order by s.sort_order)
        from (
          select *
          from public.services
          where status = 'published'
          order by sort_order
          limit 8
        ) s
      ), '[]'::jsonb),
    'process_steps',
      coalesce((
        select jsonb_agg(to_jsonb(ps) order by ps.sort_order, ps.step_number)
        from public.process_steps ps
        where ps.status = 'published'
      ), '[]'::jsonb),
    'before_after_items',
      coalesce((
        select jsonb_agg(to_jsonb(ba) order by ba.sort_order)
        from public.before_after_items ba
        where ba.status = 'published'
      ), '[]'::jsonb),
    'testimonials',
      coalesce((
        select jsonb_agg(to_jsonb(t) order by t.sort_order)
        from public.testimonials t
        where t.status = 'published'
      ), '[]'::jsonb),
    'faqs',
      coalesce((
        select jsonb_agg(to_jsonb(f) order by f.sort_order)
        from public.faqs f
        where f.status = 'published'
          and f.page_key = 'home'
      ), '[]'::jsonb),
    'cta_blocks',
      coalesce((
        select jsonb_agg(to_jsonb(cb) order by cb.updated_at desc nulls last, cb.created_at desc nulls last)
        from (
          select *
          from public.cta_blocks
          where status = 'published'
            and block_key = 'home_final'
          order by updated_at desc nulls last, created_at desc nulls last
          limit 1
        ) cb
      ), '[]'::jsonb)
  );
$$;

grant execute on function public.get_public_home_bundle() to anon, authenticated;
