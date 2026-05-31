-- Tighten legacy admin policies so roles are enforced by the database, not only by hidden buttons.
-- Public "published content" read policies stay in place. This migration replaces broad admin write policies.

drop policy if exists "Admins can manage services" on public.services;
drop policy if exists "Authenticated admins can manage services" on public.services;
drop policy if exists "Admin roles can read services" on public.services;
drop policy if exists "Content roles can write services" on public.services;
create policy "Admin roles can read services"
on public.services for select
using (public.has_admin_role(array['super_admin', 'content_editor', 'lead_manager', 'viewer']));
create policy "Content roles can write services"
on public.services for all
using (public.has_admin_role(array['super_admin', 'content_editor']))
with check (public.has_admin_role(array['super_admin', 'content_editor']));

drop policy if exists "Admins can manage projects" on public.projects;
drop policy if exists "Authenticated admins can manage projects" on public.projects;
drop policy if exists "Admin roles can read projects" on public.projects;
drop policy if exists "Content roles can write projects" on public.projects;
create policy "Admin roles can read projects"
on public.projects for select
using (public.has_admin_role(array['super_admin', 'content_editor', 'lead_manager', 'viewer']));
create policy "Content roles can write projects"
on public.projects for all
using (public.has_admin_role(array['super_admin', 'content_editor']))
with check (public.has_admin_role(array['super_admin', 'content_editor']));

drop policy if exists "Admins can manage project images" on public.project_images;
drop policy if exists "Authenticated admins can manage project images" on public.project_images;
drop policy if exists "Admin roles can read project images" on public.project_images;
drop policy if exists "Content roles can write project images" on public.project_images;
create policy "Admin roles can read project images"
on public.project_images for select
using (public.has_admin_role(array['super_admin', 'content_editor', 'lead_manager', 'viewer']));
create policy "Content roles can write project images"
on public.project_images for all
using (public.has_admin_role(array['super_admin', 'content_editor']))
with check (public.has_admin_role(array['super_admin', 'content_editor']));

drop policy if exists "Admins can manage blog posts" on public.blog_posts;
drop policy if exists "Authenticated admins can manage blog posts" on public.blog_posts;
drop policy if exists "Admin roles can read blog posts" on public.blog_posts;
drop policy if exists "Content roles can write blog posts" on public.blog_posts;
create policy "Admin roles can read blog posts"
on public.blog_posts for select
using (public.has_admin_role(array['super_admin', 'content_editor', 'lead_manager', 'viewer']));
create policy "Content roles can write blog posts"
on public.blog_posts for all
using (public.has_admin_role(array['super_admin', 'content_editor']))
with check (public.has_admin_role(array['super_admin', 'content_editor']));

drop policy if exists "Admins can manage materials" on public.materials;
drop policy if exists "Authenticated admins can manage materials" on public.materials;
drop policy if exists "Admin roles can read materials" on public.materials;
drop policy if exists "Content roles can write materials" on public.materials;
create policy "Admin roles can read materials"
on public.materials for select
using (public.has_admin_role(array['super_admin', 'content_editor', 'lead_manager', 'viewer']));
create policy "Content roles can write materials"
on public.materials for all
using (public.has_admin_role(array['super_admin', 'content_editor']))
with check (public.has_admin_role(array['super_admin', 'content_editor']));

drop policy if exists "Admins can manage testimonials" on public.testimonials;
drop policy if exists "Authenticated admins can manage testimonials" on public.testimonials;
drop policy if exists "Admin roles can read testimonials" on public.testimonials;
drop policy if exists "Content roles can write testimonials" on public.testimonials;
create policy "Admin roles can read testimonials"
on public.testimonials for select
using (public.has_admin_role(array['super_admin', 'content_editor', 'lead_manager', 'viewer']));
create policy "Content roles can write testimonials"
on public.testimonials for all
using (public.has_admin_role(array['super_admin', 'content_editor']))
with check (public.has_admin_role(array['super_admin', 'content_editor']));

drop policy if exists "Admins can manage hero slides" on public.hero_slides;
drop policy if exists "Authenticated admins can manage hero slides" on public.hero_slides;
drop policy if exists "Admin roles can read hero slides" on public.hero_slides;
drop policy if exists "Content roles can write hero slides" on public.hero_slides;
create policy "Admin roles can read hero slides"
on public.hero_slides for select
using (public.has_admin_role(array['super_admin', 'content_editor', 'lead_manager', 'viewer']));
create policy "Content roles can write hero slides"
on public.hero_slides for all
using (public.has_admin_role(array['super_admin', 'content_editor']))
with check (public.has_admin_role(array['super_admin', 'content_editor']));

drop policy if exists "Admins can manage service areas" on public.service_areas;
drop policy if exists "Authenticated admins can manage service areas" on public.service_areas;
drop policy if exists "Admin roles can read service areas" on public.service_areas;
drop policy if exists "Content roles can write service areas" on public.service_areas;
create policy "Admin roles can read service areas"
on public.service_areas for select
using (public.has_admin_role(array['super_admin', 'content_editor', 'lead_manager', 'viewer']));
create policy "Content roles can write service areas"
on public.service_areas for all
using (public.has_admin_role(array['super_admin', 'content_editor']))
with check (public.has_admin_role(array['super_admin', 'content_editor']));

drop policy if exists "Admins can manage landing pages" on public.landing_pages;
drop policy if exists "Admin roles can read landing pages" on public.landing_pages;
drop policy if exists "Content roles can write landing pages" on public.landing_pages;
create policy "Admin roles can read landing pages"
on public.landing_pages for select
using (public.has_admin_role(array['super_admin', 'content_editor', 'lead_manager', 'viewer']));
create policy "Content roles can write landing pages"
on public.landing_pages for all
using (public.has_admin_role(array['super_admin', 'content_editor']))
with check (public.has_admin_role(array['super_admin', 'content_editor']));

drop policy if exists "Admins can manage media assets" on public.media_assets;
drop policy if exists "Admin roles can read media assets" on public.media_assets;
drop policy if exists "Content roles can write media assets" on public.media_assets;
create policy "Admin roles can read media assets"
on public.media_assets for select
using (public.has_admin_role(array['super_admin', 'content_editor', 'lead_manager', 'viewer']));
create policy "Content roles can write media assets"
on public.media_assets for all
using (public.has_admin_role(array['super_admin', 'content_editor']))
with check (public.has_admin_role(array['super_admin', 'content_editor']));

drop policy if exists "Admins can manage site settings" on public.site_settings;
drop policy if exists "Admin roles can read site settings" on public.site_settings;
drop policy if exists "Content roles can write site settings" on public.site_settings;
create policy "Admin roles can read site settings"
on public.site_settings for select
using (public.has_admin_role(array['super_admin', 'content_editor', 'lead_manager', 'viewer']));
create policy "Content roles can write site settings"
on public.site_settings for all
using (public.has_admin_role(array['super_admin', 'content_editor']))
with check (public.has_admin_role(array['super_admin', 'content_editor']));

drop policy if exists "Admins can manage site pages" on public.site_pages;
drop policy if exists "Admin roles can read site pages" on public.site_pages;
drop policy if exists "Content roles can write site pages" on public.site_pages;
create policy "Admin roles can read site pages"
on public.site_pages for select
using (public.has_admin_role(array['super_admin', 'content_editor', 'lead_manager', 'viewer']));
create policy "Content roles can write site pages"
on public.site_pages for all
using (public.has_admin_role(array['super_admin', 'content_editor']))
with check (public.has_admin_role(array['super_admin', 'content_editor']));

drop policy if exists "Admins can manage home sections" on public.home_sections;
drop policy if exists "Admin roles can read home sections" on public.home_sections;
drop policy if exists "Content roles can write home sections" on public.home_sections;
create policy "Admin roles can read home sections"
on public.home_sections for select
using (public.has_admin_role(array['super_admin', 'content_editor', 'lead_manager', 'viewer']));
create policy "Content roles can write home sections"
on public.home_sections for all
using (public.has_admin_role(array['super_admin', 'content_editor']))
with check (public.has_admin_role(array['super_admin', 'content_editor']));

drop policy if exists "Admins can manage faqs" on public.faqs;
drop policy if exists "Admin roles can read faqs" on public.faqs;
drop policy if exists "Content roles can write faqs" on public.faqs;
create policy "Admin roles can read faqs"
on public.faqs for select
using (public.has_admin_role(array['super_admin', 'content_editor', 'lead_manager', 'viewer']));
create policy "Content roles can write faqs"
on public.faqs for all
using (public.has_admin_role(array['super_admin', 'content_editor']))
with check (public.has_admin_role(array['super_admin', 'content_editor']));

drop policy if exists "Admins can manage before after items" on public.before_after_items;
drop policy if exists "Admin roles can read before after items" on public.before_after_items;
drop policy if exists "Content roles can write before after items" on public.before_after_items;
create policy "Admin roles can read before after items"
on public.before_after_items for select
using (public.has_admin_role(array['super_admin', 'content_editor', 'lead_manager', 'viewer']));
create policy "Content roles can write before after items"
on public.before_after_items for all
using (public.has_admin_role(array['super_admin', 'content_editor']))
with check (public.has_admin_role(array['super_admin', 'content_editor']));

drop policy if exists "Admins can manage brand partners" on public.brand_partners;
drop policy if exists "Admin roles can read brand partners" on public.brand_partners;
drop policy if exists "Content roles can write brand partners" on public.brand_partners;
create policy "Admin roles can read brand partners"
on public.brand_partners for select
using (public.has_admin_role(array['super_admin', 'content_editor', 'lead_manager', 'viewer']));
create policy "Content roles can write brand partners"
on public.brand_partners for all
using (public.has_admin_role(array['super_admin', 'content_editor']))
with check (public.has_admin_role(array['super_admin', 'content_editor']));

drop policy if exists "Admins can manage about sections" on public.about_sections;
drop policy if exists "Admin roles can read about sections" on public.about_sections;
drop policy if exists "Content roles can write about sections" on public.about_sections;
create policy "Admin roles can read about sections"
on public.about_sections for select
using (public.has_admin_role(array['super_admin', 'content_editor', 'lead_manager', 'viewer']));
create policy "Content roles can write about sections"
on public.about_sections for all
using (public.has_admin_role(array['super_admin', 'content_editor']))
with check (public.has_admin_role(array['super_admin', 'content_editor']));

drop policy if exists "Admins can manage process steps" on public.process_steps;
drop policy if exists "Admin roles can read process steps" on public.process_steps;
drop policy if exists "Content roles can write process steps" on public.process_steps;
create policy "Admin roles can read process steps"
on public.process_steps for select
using (public.has_admin_role(array['super_admin', 'content_editor', 'lead_manager', 'viewer']));
create policy "Content roles can write process steps"
on public.process_steps for all
using (public.has_admin_role(array['super_admin', 'content_editor']))
with check (public.has_admin_role(array['super_admin', 'content_editor']));

drop policy if exists "Admins can manage cta blocks" on public.cta_blocks;
drop policy if exists "Admin roles can read cta blocks" on public.cta_blocks;
drop policy if exists "Content roles can write cta blocks" on public.cta_blocks;
create policy "Admin roles can read cta blocks"
on public.cta_blocks for select
using (public.has_admin_role(array['super_admin', 'content_editor', 'lead_manager', 'viewer']));
create policy "Content roles can write cta blocks"
on public.cta_blocks for all
using (public.has_admin_role(array['super_admin', 'content_editor']))
with check (public.has_admin_role(array['super_admin', 'content_editor']));

drop policy if exists "Admins can manage leads" on public.leads;
drop policy if exists "Authenticated admins can manage leads" on public.leads;
drop policy if exists "Admin roles can read leads" on public.leads;
drop policy if exists "Lead roles can write leads" on public.leads;
create policy "Admin roles can read leads"
on public.leads for select
using (public.has_admin_role(array['super_admin', 'lead_manager', 'viewer']));
create policy "Lead roles can write leads"
on public.leads for all
using (public.has_admin_role(array['super_admin', 'lead_manager']))
with check (public.has_admin_role(array['super_admin', 'lead_manager']));

drop policy if exists "Admins can manage quote requests" on public.quote_requests;
drop policy if exists "Authenticated admins can manage quote requests" on public.quote_requests;
drop policy if exists "Admin roles can read quote requests" on public.quote_requests;
drop policy if exists "Lead roles can write quote requests" on public.quote_requests;
create policy "Admin roles can read quote requests"
on public.quote_requests for select
using (public.has_admin_role(array['super_admin', 'lead_manager', 'viewer']));
create policy "Lead roles can write quote requests"
on public.quote_requests for all
using (public.has_admin_role(array['super_admin', 'lead_manager']))
with check (public.has_admin_role(array['super_admin', 'lead_manager']));

drop policy if exists "Admins can manage lead followups" on public.lead_followups;
drop policy if exists "Admin roles can read lead followups" on public.lead_followups;
drop policy if exists "Lead roles can write lead followups" on public.lead_followups;
create policy "Admin roles can read lead followups"
on public.lead_followups for select
using (public.has_admin_role(array['super_admin', 'lead_manager', 'viewer']));
create policy "Lead roles can write lead followups"
on public.lead_followups for all
using (public.has_admin_role(array['super_admin', 'lead_manager']))
with check (public.has_admin_role(array['super_admin', 'lead_manager']));

drop policy if exists "Admins can manage translation jobs" on public.translation_jobs;
drop policy if exists "Authenticated admins can manage translation jobs" on public.translation_jobs;
drop policy if exists "Admin roles can read translation jobs" on public.translation_jobs;
drop policy if exists "Content roles can write translation jobs" on public.translation_jobs;
create policy "Admin roles can read translation jobs"
on public.translation_jobs for select
using (public.has_admin_role(array['super_admin', 'content_editor', 'viewer']));
create policy "Content roles can write translation jobs"
on public.translation_jobs for all
using (public.has_admin_role(array['super_admin', 'content_editor']))
with check (public.has_admin_role(array['super_admin', 'content_editor']));

drop policy if exists "Admins can manage notification settings" on public.notification_settings;
drop policy if exists "Super admins can manage notification settings" on public.notification_settings;
create policy "Super admins can manage notification settings"
on public.notification_settings for all
using (public.has_admin_role(array['super_admin']))
with check (public.has_admin_role(array['super_admin']));

drop policy if exists "Admins can manage maintenance reminder items" on public.maintenance_reminder_items;
drop policy if exists "Super admins can manage maintenance reminder items" on public.maintenance_reminder_items;
create policy "Super admins can manage maintenance reminder items"
on public.maintenance_reminder_items for all
using (public.has_admin_role(array['super_admin']))
with check (public.has_admin_role(array['super_admin']));

drop policy if exists "Admins can upload site images" on storage.objects;
drop policy if exists "Admins can update site images" on storage.objects;
drop policy if exists "Admins can delete site images" on storage.objects;
drop policy if exists "Authenticated admins can upload site images" on storage.objects;
drop policy if exists "Authenticated admins can update site images" on storage.objects;
drop policy if exists "Authenticated admins can delete site images" on storage.objects;
drop policy if exists "Content roles can upload site images" on storage.objects;
drop policy if exists "Content roles can update site images" on storage.objects;
drop policy if exists "Content roles can delete site images" on storage.objects;

create policy "Content roles can upload site images"
on storage.objects for insert
with check (bucket_id = 'site-images' and public.has_admin_role(array['super_admin', 'content_editor']));

create policy "Content roles can update site images"
on storage.objects for update
using (bucket_id = 'site-images' and public.has_admin_role(array['super_admin', 'content_editor']))
with check (bucket_id = 'site-images' and public.has_admin_role(array['super_admin', 'content_editor']));

create policy "Content roles can delete site images"
on storage.objects for delete
using (bucket_id = 'site-images' and public.has_admin_role(array['super_admin', 'content_editor']));
