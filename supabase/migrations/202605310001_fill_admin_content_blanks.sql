-- Fill admin content blanks found by the content health check.
-- The updates only write empty fields, so existing admin edits stay untouched.

with patches(page_key, content_en, image_url) as (
  values
    ('about', 'Learn more about FLASH CAST SDN. BHD., our renovation approach, in-house team, company background, and the way we support residential and commercial projects across Kuala Lumpur and Selangor.', '/images/heroes/hero-about.webp'),
    ('blog', 'Read practical renovation guides from FLASH CAST, including budgeting, materials, approvals, waterproofing, kitchen cabinets, office fit-out, and planning tips for Malaysia projects.', '/images/heroes/hero-materials.webp'),
    ('materials_category', 'Browse renovation material category options and compare usage, style, durability, maintenance, and budget notes before shortlisting materials for your project.', '/images/heroes/hero-materials.webp'),
    ('service_detail', 'Review each renovation service in detail, including suitable project types, common work scope, process notes, and practical questions before requesting a quotation.', '/images/heroes/hero-services.webp'),
    ('contact', 'Contact FLASH CAST for renovation consultation, site review, quotation, or general project enquiries in Kuala Lumpur, Selangor, and nearby Klang Valley areas.', null),
    ('faq', 'Find answers to common renovation questions about project scope, quotation, materials, condo approvals, timeline, and how FLASH CAST handles enquiries.', null),
    ('materials', 'Explore renovation materials by category and compare practical options for cabinets, flooring, bathroom fittings, doors, windows, wall panels, and custom built-in works.', null),
    ('projects', 'Browse selected renovation project references by FLASH CAST, including residential homes, commercial spaces, custom built-in works, and practical project notes.', null),
    ('quote', 'Send us your renovation details, photos, location, rough budget, and preferred timeline so the team can review the project and suggest the next step.', null)
)
update public.site_pages target
set
  content_en = case
    when nullif(btrim(target.content_en), '') is null then patches.content_en
    else target.content_en
  end,
  image_url = case
    when patches.image_url is not null and nullif(btrim(target.image_url), '') is null then patches.image_url
    else target.image_url
  end
from patches
where target.page_key = patches.page_key
  and (
    nullif(btrim(target.content_en), '') is null
    or (patches.image_url is not null and nullif(btrim(target.image_url), '') is null)
  );

with patches(section_key, subtitle_en, image_url) as (
  values
    ('stats', 'A quick view of our project focus and service coverage.', '/images/heroes/hero-projects.webp'),
    ('why_choose_us', null, '/images/heroes/hero-luxury-living.webp')
)
update public.home_sections target
set
  subtitle_en = case
    when patches.subtitle_en is not null and nullif(btrim(target.subtitle_en), '') is null then patches.subtitle_en
    else target.subtitle_en
  end,
  image_url = case
    when patches.image_url is not null and nullif(btrim(target.image_url), '') is null then patches.image_url
    else target.image_url
  end
from patches
where target.section_key = patches.section_key
  and (
    (patches.subtitle_en is not null and nullif(btrim(target.subtitle_en), '') is null)
    or (patches.image_url is not null and nullif(btrim(target.image_url), '') is null)
  );

with patches(section_key, subtitle_en, image_url, items_en) as (
  values
    (
      'hero',
      'A renovation partner focused on clear planning, practical workmanship, and dependable project delivery.',
      null::text,
      jsonb_build_array(
        'Residential and commercial renovation planning',
        'Custom built-in furniture and material advice',
        'Project coordination across Kuala Lumpur and Selangor'
      )
    ),
    ('intro', 'A Kuala Lumpur based renovation team serving homes and commercial spaces.', '/images/heroes/hero-about.webp', null::jsonb),
    ('stats', 'Simple numbers that reflect our focus and service coverage.', '/images/heroes/hero-projects.webp', null::jsonb),
    ('core_values', 'The principles we use to guide every renovation project.', '/images/heroes/hero-process.webp', null::jsonb),
    ('team', 'Coordinated design, project management, carpentry, and site teams.', '/images/heroes/hero-services.webp', null::jsonb),
    ('milestones', 'How FLASH CAST grew from renovation work into full design-and-build service.', '/images/heroes/hero-about.webp', null::jsonb),
    (
      'office',
      'Visit our Kuala Lumpur office or contact us to discuss your renovation plans.',
      '/images/heroes/hero-contact.webp',
      jsonb_build_array(
        'Office: 94, Jalan Mega Mendung, Taman United, 58200 Kuala Lumpur',
        'Service area: Kuala Lumpur, Selangor, and nearby Klang Valley areas',
        'Consultation: renovation planning, site review, and quotation'
      )
    )
)
update public.about_sections target
set
  subtitle_en = case
    when nullif(btrim(target.subtitle_en), '') is null then patches.subtitle_en
    else target.subtitle_en
  end,
  image_url = case
    when patches.image_url is not null and nullif(btrim(target.image_url), '') is null then patches.image_url
    else target.image_url
  end,
  items_en = case
    when patches.items_en is not null and (target.items_en is null or target.items_en = '[]'::jsonb) then patches.items_en
    else target.items_en
  end
from patches
where target.section_key = patches.section_key
  and (
    nullif(btrim(target.subtitle_en), '') is null
    or (patches.image_url is not null and nullif(btrim(target.image_url), '') is null)
    or (patches.items_en is not null and (target.items_en is null or target.items_en = '[]'::jsonb))
  );

with patches(block_key, image_url) as (
  values
    ('home_final', '/images/heroes/hero-quote.webp'),
    ('about_final', '/images/heroes/hero-about.webp')
)
update public.cta_blocks target
set image_url = patches.image_url
from patches
where target.block_key = patches.block_key
  and nullif(btrim(target.image_url), '') is null;

update public.cms_pages
set
  seo_title_zh = case
    when nullif(btrim(seo_title_zh), '') is null then '吉隆坡装修公司 | FLASH CAST'
    else seo_title_zh
  end,
  seo_description_zh = case
    when nullif(btrim(seo_description_zh), '') is null then 'FLASH CAST 提供吉隆坡与雪兰莪住宅装修、商业空间、定制家具、材料建议和项目管理服务。'
    else seo_description_zh
  end,
  seo_title_en = case
    when nullif(btrim(seo_title_en), '') is null then 'Renovation Company Kuala Lumpur | FLASH CAST'
    else seo_title_en
  end,
  seo_description_en = case
    when nullif(btrim(seo_description_en), '') is null then 'FLASH CAST provides residential renovation, commercial fit-out, custom built-in furniture, material advice, and project management in Kuala Lumpur and Selangor.'
    else seo_description_en
  end
where page_key = 'home'
  and (
    nullif(btrim(seo_title_zh), '') is null
    or nullif(btrim(seo_description_zh), '') is null
    or nullif(btrim(seo_title_en), '') is null
    or nullif(btrim(seo_description_en), '') is null
  );
