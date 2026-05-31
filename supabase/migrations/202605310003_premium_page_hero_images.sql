-- Replace old subpage hero images with the premium v2 generated assets.
-- The homepage video/poster is intentionally not changed here.

with hero_images(page_key, image_url, old_urls) as (
  values
    ('about', '/images/heroes/v2/hero-about-premium.webp', array['/images/heroes/hero-about.webp']),
    ('services', '/images/heroes/v2/hero-services-premium.webp', array['/images/heroes/hero-services.webp']),
    ('projects', '/images/heroes/v2/hero-projects-premium.webp', array['/images/heroes/hero-projects.webp']),
    ('materials', '/images/heroes/v2/hero-materials-premium.webp', array['/images/heroes/hero-materials.webp']),
    ('faq', '/images/heroes/v2/hero-faq-premium.webp', array['/images/heroes/hero-faq.webp']),
    ('contact', '/images/heroes/v2/hero-contact-premium.webp', array['/images/heroes/hero-contact.webp']),
    ('quote', '/images/heroes/v2/hero-quote-premium.webp', array['/images/heroes/hero-quote.webp']),
    ('blog', '/images/heroes/v2/hero-blog-premium.webp', array['/images/heroes/hero-materials.webp']),
    ('process', '/images/heroes/v2/hero-process-premium.webp', array['/images/heroes/hero-process.webp']),
    ('materials_category', '/images/heroes/v2/hero-materials-premium.webp', array['/images/heroes/hero-materials.webp']),
    ('service_detail', '/images/heroes/v2/hero-services-premium.webp', array['/images/heroes/hero-services.webp'])
)
update public.site_pages target
set image_url = hero_images.image_url
from hero_images
where target.page_key = hero_images.page_key
  and (
    nullif(btrim(target.image_url), '') is null
    or target.image_url = any(hero_images.old_urls)
    or target.image_url = hero_images.image_url
  );

with hero_images(section_key, image_url, old_urls) as (
  values
    ('hero', '/images/heroes/v2/hero-about-premium.webp', array['/images/heroes/hero-about.webp'])
)
update public.about_sections target
set image_url = hero_images.image_url
from hero_images
where target.section_key = hero_images.section_key
  and (
    nullif(btrim(target.image_url), '') is null
    or target.image_url = any(hero_images.old_urls)
    or target.image_url = hero_images.image_url
  );
