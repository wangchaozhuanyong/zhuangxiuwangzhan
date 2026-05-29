create table if not exists public.site_pages (
  id uuid primary key default gen_random_uuid(),
  page_key text not null unique,
  path text not null,
  title_zh text,
  title_en text,
  subtitle_zh text,
  subtitle_en text,
  description_zh text,
  description_en text,
  content_zh text,
  content_en text,
  cta_title_zh text,
  cta_title_en text,
  cta_description_zh text,
  cta_description_en text,
  image_url text,
  alt_zh text,
  alt_en text,
  seo_title_zh text,
  seo_title_en text,
  seo_description_zh text,
  seo_description_en text,
  seo_keywords_zh text,
  seo_keywords_en text,
  items_zh jsonb default '[]'::jsonb,
  items_en jsonb default '[]'::jsonb,
  status public.content_status default 'published',
  sort_order integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

drop trigger if exists touch_site_pages_updated_at on public.site_pages;
create trigger touch_site_pages_updated_at
before update on public.site_pages
for each row execute function public.touch_updated_at();

alter table public.site_pages enable row level security;

drop policy if exists "Public can read published site pages" on public.site_pages;
create policy "Public can read published site pages"
on public.site_pages for select
using (status = 'published');

drop policy if exists "Admins can manage site pages" on public.site_pages;
create policy "Admins can manage site pages"
on public.site_pages for all
using (public.is_admin())
with check (public.is_admin());

insert into public.site_pages (
  page_key,
  path,
  title_zh,
  title_en,
  subtitle_zh,
  subtitle_en,
  description_zh,
  description_en,
  cta_title_zh,
  cta_title_en,
  cta_description_zh,
  cta_description_en,
  image_url,
  alt_zh,
  alt_en,
  seo_title_zh,
  seo_title_en,
  seo_description_zh,
  seo_description_en,
  seo_keywords_zh,
  seo_keywords_en,
  status,
  sort_order
) values
(
  'services',
  '/services',
  '服务项目',
  'Our Services',
  '服务范围',
  'What We Do',
  '覆盖吉隆坡与雪兰莪的装修服务，从室内设计、定制内嵌家具到商业空间装修、艺术墙面涂装和仓储系统。',
  'Comprehensive renovation services across Kuala Lumpur and Selangor, from interior design and custom built-in to commercial fit-out, artistic wall coating, and warehouse systems.',
  '需要确认适合的装修服务？',
  'Not Sure What You Need?',
  '联系我们免费咨询，我们会根据你的空间和预算建议合适方案。',
  'Contact us for a free consultation. We will assess your space and recommend the right approach.',
  '/images/heroes/hero-services.webp',
  'FLASH CAST 吉隆坡装修服务',
  'FLASH CAST renovation services in Kuala Lumpur',
  '吉隆坡装修服务 | 室内装修、定制家具、商业空间 | FLASH CAST',
  'Renovation Services Kuala Lumpur | Interior, Built-In, Commercial & Artistic Coating',
  'FLASH CAST 提供吉隆坡与雪兰莪装修服务：室内设计、定制家具、商业空间装修、艺术墙面涂装、外墙工程和仓储架系统。',
  'Explore FLASH CAST''s comprehensive renovation services in Kuala Lumpur and Selangor: interior design, custom built-in furniture, commercial fit-out, artistic wall coating, exterior works, and warehouse solutions.',
  '吉隆坡装修服务, 马来西亚室内设计, 雪兰莪商业装修, 定制家具, Remmers 艺术涂装',
  'renovation services KL, interior design Kuala Lumpur, custom built-in Malaysia, commercial renovation Selangor, artistic wall coating Remmers, shop renovation KL',
  'published',
  10
),
(
  'faq',
  '/faq',
  '常见问题',
  'Frequently Asked Questions',
  '帮助中心',
  'Help Center',
  '关于装修服务、流程、报价、材料和准证的常见问题整理。',
  'Common questions about our renovation services, process, pricing, and materials.',
  '还有其他问题？',
  'Still Have Questions?',
  '欢迎直接联系我们，我们会根据你的项目情况给出建议。',
  'Reach out to us directly. We are happy to help.',
  '/images/heroes/hero-faq.webp',
  'FLASH CAST 装修常见问题',
  'FLASH CAST FAQ',
  '常见问题 | 吉隆坡装修问答 | FLASH CAST',
  'FAQ | Renovation Questions Kuala Lumpur | FLASH CAST',
  'FLASH CAST 整理马来西亚装修服务、报价、材料、定制家具和准证申请常见问题，服务吉隆坡与雪兰莪。',
  'Frequently asked questions about renovation services, pricing, materials, custom built-in furniture, and permits in Kuala Lumpur and Selangor by FLASH CAST SDN. BHD.',
  '马来西亚装修常见问题, 吉隆坡装修问答, 定制家具 FAQ, DBKL 装修准证',
  'renovation FAQ Malaysia, renovation questions KL, built-in furniture FAQ, renovation permit KL',
  'published',
  20
),
(
  'contact',
  '/contact',
  '联系我们',
  'Contact Us',
  '联系我们',
  'Get In Touch',
  '准备开始装修项目？欢迎联系 FLASH CAST。我们服务吉隆坡、雪兰莪与巴生谷周边地区。',
  'Ready to start your renovation project? Get in touch with FLASH CAST. We serve Kuala Lumpur, Selangor, and surrounding areas.',
  null,
  null,
  null,
  null,
  '/images/heroes/hero-contact.webp',
  '联系 FLASH CAST 装修公司',
  'Contact FLASH CAST renovation company',
  '联系 FLASH CAST | 吉隆坡装修公司',
  'Contact FLASH CAST | Renovation Company Kuala Lumpur',
  '联系 FLASH CAST SDN. BHD. 咨询吉隆坡与雪兰莪住宅、商业空间、厨房、旧屋翻新和定制家具装修。',
  'Get in touch with FLASH CAST SDN. BHD. for your renovation project in Kuala Lumpur and Selangor.',
  '联系吉隆坡装修公司, FLASH CAST 地址, 雪兰莪装修咨询',
  'contact renovation company KL, FLASH CAST address, renovation enquiry Kuala Lumpur',
  'published',
  30
),
(
  'blog',
  '/blog',
  '装修博客与指南',
  'Blog & Insights',
  null,
  null,
  '整理装修预算、材料比较、设计灵感和施工注意事项，帮助你更清楚规划马来西亚装修项目。',
  'Renovation guides, material comparisons, design tips, and industry insights for homeowners and businesses in Malaysia.',
  null,
  null,
  null,
  null,
  null,
  null,
  null,
  '装修博客与指南 | 吉隆坡装修知识 | FLASH CAST',
  'Renovation Blog & Insights | Tips & Guides | FLASH CAST Kuala Lumpur',
  'FLASH CAST 分享马来西亚装修预算、材料比较、设计灵感和施工注意事项，帮助吉隆坡与雪兰莪业主更好规划装修。',
  'Renovation guides, material comparisons, design tips, and industry insights for homeowners and businesses in Kuala Lumpur and Malaysia by FLASH CAST.',
  '马来西亚装修博客, 吉隆坡装修指南, 装修材料比较, 雪兰莪装修知识',
  'renovation blog Malaysia, interior design tips KL, renovation guide Kuala Lumpur',
  'published',
  40
),
(
  'materials_category',
  '/materials/category/:categorySlug',
  null,
  null,
  null,
  null,
  '{description} 浏览 {category} 材料选项，适用于吉隆坡与雪兰莪装修项目。',
  '{description} Browse {category} options for your renovation project in Kuala Lumpur and Selangor.',
  '对 {category} 感兴趣？',
  'Interested in {category}?',
  '联系我们索取样板、确认供应情况，或获取项目报价。',
  'Contact us to request samples, check availability, or get a quotation for your project.',
  null,
  null,
  null,
  '{category} | 材料库 | FLASH CAST',
  '{category} | Materials | FLASH CAST',
  '{description} 浏览 {category} 材料选项，适用于吉隆坡与雪兰莪装修项目。',
  '{description} Browse {category} options for your renovation project in Kuala Lumpur and Selangor.',
  '{category} 吉隆坡, {category} 装修材料, 马来西亚装修',
  '{category} KL, {category} renovation Malaysia',
  'published',
  50
),
(
  'service_detail',
  '/services/:slug',
  null,
  null,
  null,
  null,
  null,
  null,
  null,
  null,
  '联系我们免费咨询和报价。我们服务吉隆坡、雪兰莪与周边地区。',
  'Contact us for a free consultation and quotation. We serve Kuala Lumpur, Selangor, and surrounding areas.',
  null,
  null,
  null,
  null,
  null,
  null,
  null,
  null,
  null,
  'published',
  60
)
on conflict (page_key) do nothing;

insert into public.site_pages (
  page_key,
  path,
  seo_title_zh,
  seo_title_en,
  seo_description_zh,
  seo_description_en,
  seo_keywords_zh,
  seo_keywords_en,
  status,
  sort_order
) values (
  'about',
  '/about',
  '关于 FLASH CAST | 吉隆坡装修与室内设计公司',
  'About FLASH CAST | Renovation Company in Kuala Lumpur',
  'FLASH CAST SDN. BHD. 是位于吉隆坡的注册装修与室内设计公司，服务住宅、商业和工业空间。',
  'FLASH CAST SDN. BHD. is a registered renovation and interior design company based in Kuala Lumpur, Malaysia.',
  'FLASH CAST 关于我们, 吉隆坡装修公司, 马来西亚室内设计公司',
  'about FLASH CAST, renovation company KL, interior design company Malaysia',
  'published',
  5
) on conflict (page_key) do nothing;

update public.site_pages
set
  content_zh = 'FLASH CAST SDN. BHD. 提供 {count} 项核心装修服务，服务范围覆盖吉隆坡与雪兰莪，涵盖住宅、商业空间、工业设施和德国 Remmers 艺术涂装等专业项目。',
  content_en = 'FLASH CAST SDN. BHD. provides {count} core renovation services in Kuala Lumpur and Selangor, Malaysia, covering residential homes, commercial spaces, industrial facilities, and specialty finishes including German Remmers artistic coatings.'
where page_key = 'services'
  and content_zh is null
  and content_en is null;
