-- Guard CMS singleton-style records so admin defaults can safely fill blanks
-- without creating duplicate homepage/about sections.

with ranked_home_sections as (
  select
    id,
    row_number() over (
      partition by section_key
      order by
        coalesce(jsonb_array_length(items_zh), 0) + coalesce(jsonb_array_length(items_en), 0) desc,
        updated_at desc nulls last,
        created_at desc nulls last,
        id
    ) as rn
  from public.home_sections
)
update public.home_sections target
set
  section_key = target.section_key || '__archived__' || target.id::text,
  status = 'archived'
from ranked_home_sections ranked
where target.id = ranked.id
  and ranked.rn > 1;

create unique index if not exists home_sections_section_key_unique
on public.home_sections(section_key);

with ranked_about_sections as (
  select
    id,
    row_number() over (
      partition by section_key
      order by
        coalesce(jsonb_array_length(items_zh), 0) + coalesce(jsonb_array_length(items_en), 0) desc,
        updated_at desc nulls last,
        created_at desc nulls last,
        id
    ) as rn
  from public.about_sections
)
update public.about_sections target
set
  section_key = target.section_key || '__archived__' || target.id::text,
  status = 'archived'
from ranked_about_sections ranked
where target.id = ranked.id
  and ranked.rn > 1;

create unique index if not exists about_sections_section_key_unique
on public.about_sections(section_key);

create index if not exists faqs_page_key_sort_order_idx
on public.faqs(page_key, sort_order);

create index if not exists process_steps_status_sort_order_idx
on public.process_steps(status, sort_order, step_number);

create index if not exists cta_blocks_status_block_key_idx
on public.cta_blocks(status, block_key);
