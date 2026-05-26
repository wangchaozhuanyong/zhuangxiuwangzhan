alter table public.notification_settings
  add column if not exists maintenance_reminders_enabled boolean not null default true,
  add column if not exists maintenance_reminder_day text not null default 'monday',
  add column if not exists maintenance_reminder_time text not null default '09:00',
  add column if not exists maintenance_timezone text not null default 'Asia/Kuala_Lumpur',
  add column if not exists maintenance_last_sent_at timestamptz;

create table if not exists public.maintenance_reminder_items (
  id text primary key,
  category text not null,
  title text not null,
  description text not null default '',
  frequency text not null default 'weekly' check (frequency in ('weekly', 'monthly')),
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.maintenance_reminder_items enable row level security;

drop policy if exists "Admins can read maintenance reminder items" on public.maintenance_reminder_items;
create policy "Admins can read maintenance reminder items" on public.maintenance_reminder_items
  for select using (public.is_admin());

drop policy if exists "Admins can manage maintenance reminder items" on public.maintenance_reminder_items;
create policy "Admins can manage maintenance reminder items" on public.maintenance_reminder_items
  for all using (public.is_admin()) with check (public.is_admin());

drop trigger if exists touch_maintenance_reminder_items_updated_at on public.maintenance_reminder_items;
create trigger touch_maintenance_reminder_items_updated_at
  before update on public.maintenance_reminder_items
  for each row execute function public.touch_updated_at();

insert into public.maintenance_reminder_items (id, category, title, description, frequency, sort_order, active) values
  ('seo-search-console', 'Traffic and SEO', 'Check Google Search Console', 'Review indexing issues, coverage warnings, search performance, and manual actions.', 'weekly', 10, true),
  ('seo-sitemap-robots', 'Traffic and SEO', 'Verify sitemap and robots', 'Confirm sitemap.xml and robots.txt return 200 and point to the correct live URLs.', 'weekly', 20, true),
  ('seo-page-tags', 'Traffic and SEO', 'Spot-check SEO tags', 'Check title, description, canonical, hreflang, and Open Graph on one or two important pages.', 'weekly', 30, true),
  ('leads-new-review', 'Lead Handling', 'Review new leads and quote requests', 'Check leads and quote_requests, then update status so new enquiries do not sit untouched.', 'weekly', 40, true),
  ('leads-older-than-24h', 'Lead Handling', 'Follow up submissions older than 24 hours', 'Prioritize new leads or pending quote requests that have not been processed within 24 hours.', 'weekly', 50, true),
  ('telegram-health', 'Lead Handling', 'Confirm Telegram alerts are arriving', 'Send a test alert when needed and confirm the bot still reaches the correct chat.', 'weekly', 60, true),
  ('content-homepage', 'Content Health', 'Review homepage and CTA copy', 'Check hero, CTA sections, FAQ, contact details, and WhatsApp entry points for stale copy.', 'weekly', 70, true),
  ('content-cases', 'Content Health', 'Check new project cases', 'Confirm project cases have multiple images, before/after images where available, and bilingual alt text.', 'weekly', 80, true),
  ('content-blog-location', 'Content Health', 'Review blog and location pages', 'Confirm blog SEO fields, tags, internal links, and local service area relevance.', 'weekly', 90, true),
  ('technical-smoke-test', 'Technical Checks', 'Run production smoke test', 'Open /zh, /en, /zh/quote, /zh/contact, one project page, and one location page.', 'weekly', 100, true),
  ('technical-mobile-cta', 'Technical Checks', 'Check mobile CTA actions', 'Confirm mobile WhatsApp, phone, and quote buttons are visible and clickable.', 'weekly', 110, true),
  ('technical-cloudflare-supabase', 'Technical Checks', 'Review Cloudflare and Supabase health', 'Check failed deployments, Supabase admin access, and function errors if any.', 'weekly', 120, true),
  ('monthly-blog', 'Monthly Tasks', 'Publish at least one SEO blog post', 'Add one practical renovation article targeting KL, Selangor, materials, budget, or service keywords.', 'monthly', 130, true),
  ('monthly-case-study', 'Monthly Tasks', 'Add or refresh one case study', 'Add a completed project or improve an existing case with better photos, scope, materials, and CTA.', 'monthly', 140, true),
  ('monthly-location-material', 'Monthly Tasks', 'Expand one location or material page', 'Improve one local SEO page or material page with stronger detail and internal links.', 'monthly', 150, true)
on conflict (id) do update set
  category = excluded.category,
  title = excluded.title,
  description = excluded.description,
  frequency = excluded.frequency,
  sort_order = excluded.sort_order,
  active = excluded.active,
  updated_at = now();

