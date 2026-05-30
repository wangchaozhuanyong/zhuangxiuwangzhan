# Supabase Deployment Notes

## Apply Database Migrations

Run the migrations in `supabase/migrations` against the target Supabase project.

Required objects include:

- CMS tables: `services`, `projects`, `project_images`, `blog_posts`, `materials`, `testimonials`, `hero_slides`, `service_areas`, `landing_pages`, `home_sections`, `about_sections`, `faqs`, `cta_blocks`, `site_pages`, `cms_pages`, `cms_sections`, `cms_content_entries`
- Lead tables: `leads`, `quote_requests`, including workflow statuses and quote follow-up notes from the latest migrations
- Translation tracking: `translation_jobs`
- Notification settings: `notification_settings`
- Storage bucket: `site-images`
- Admin allowlist: `admin_users`

## Load Production Content

After migrations, run the production content script. It upserts the CMS content and refreshes project image galleries with public image paths:

```powershell
$env:VITE_SUPABASE_URL="https://<project-ref>.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY="<service-role-key>"
node scripts/upsert-production-content.mjs
```

The script adds publishable content for:

- homepage hero slides
- core renovation services
- Kuala Lumpur, Selangor, Petaling Jaya, Subang Jaya, Puchong, Cheras, Mont Kiara, and Bangsar SEO area pages
- flooring, kitchen cabinet, office, shop, warehouse shelving, bathroom, and old-house landing pages
- project case studies with gallery cover images
- materials library entries
- SEO blog posts
- customer testimonials

All production content includes Chinese and English fields and remains editable in the admin CMS. The script is safe to rerun for slug-based content; hero slides, testimonials, and project image galleries are refreshed to avoid duplicates.

## Create The First Admin

After migrations are applied, create the first Supabase Auth user in the Supabase dashboard, then grant admin access using one of these options:

```sql
insert into public.admin_users (user_id, email)
values ('<auth-user-id>', 'admin@flashcast.com.my');
```

Alternatively, set the user's `app_metadata.role` to `admin` in Supabase Auth. The frontend admin panel and database RLS both call `public.is_admin()`, so non-admin authenticated users cannot manage content or read leads.

## Deploy Edge Functions

Deploy these functions:

- `generate-english-content`
- `notification-settings`
- `notify-lead`
- `maintenance-reminder`
- `sitemap`
- `health-check`

`generate-english-content` is intentionally limited to CMS tables that contain Chinese `_zh` fields. It currently supports `services`, `projects`, `project_images`, `blog_posts`, `materials`, `testimonials`, `hero_slides`, `service_areas`, `landing_pages`, `home_sections`, `about_sections`, `faqs`, `cta_blocks`, `site_pages`, `cms_pages`, `cms_sections`, and `cms_content_entries`. It only fills empty English fields by default; use `force: true` only when an admin confirms that existing English can be overwritten. The function now uses Google Translate's public web translation endpoint, so it does not require an OpenAI key or Google Cloud Translation API key.

## Required Frontend Env

Set these in the website hosting environment:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_SITE_URL=https://flashcast.com.my
VITE_SITE_EMAIL=info@flashcast.com.my
VITE_SITE_PHONE_DISPLAY=+60 11-2885 3888
VITE_SITE_PHONE_E164=+601128853888
VITE_SITE_WHATSAPP_NUMBER=601128853888
VITE_SITE_SSM_NUMBER=202501027419 (1628831-M)
VITE_SITE_ADDRESS=94, Jalan Mega Mendung, Taman United, 58200 Kuala Lumpur, Malaysia
VITE_SITE_SHORT_ADDRESS=94, Jalan Mega Mendung, 58200
VITE_SOCIAL_FACEBOOK=
VITE_SOCIAL_INSTAGRAM=
VITE_SOCIAL_TIKTOK=
VITE_SOCIAL_XIAOHONGSHU=
VITE_SOCIAL_LINKEDIN=
```

## Required Site Details Before Launch

Confirm and set these hosting environment variables before production launch:

- Replace the placeholder WhatsApp and phone values with the real company number.
- Replace `VITE_SITE_SSM_NUMBER` with the real SSM registration number.
- Confirm `VITE_SITE_EMAIL`, `VITE_SITE_ADDRESS`, and `VITE_SITE_URL`.
- Add real social profile URLs when available. Empty social URLs are ignored in JSON-LD.

## Required Supabase Function Secrets

Set these in Supabase function secrets:

```env
SUPABASE_SERVICE_ROLE_KEY=
LEAD_NOTIFICATION_WEBHOOK_URL=
SITE_URL=https://flashcast.com.my
MAINTENANCE_REMINDER_CRON_SECRET=
```

## Health Check

After deploying functions, confirm:

```text
GET https://<project-ref>.functions.supabase.co/health-check
```

The response should return `ok: true` and include checks for `cms_pages`, `site_settings`, and the `site-images` storage bucket.

Automatic English generation uses Google Translate's public web translation endpoint and does not need a translation API secret. Telegram notifications are configured in the admin panel at `/admin/notifications`; `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` can still be set as optional environment fallbacks, but the preferred production path is the admin settings page. `LEAD_NOTIFICATION_WEBHOOK_URL` is optional and can point to Make, Zapier, a WhatsApp Business API relay, or another CRM.

If WhatsApp Business API is not ready yet, keep `LEAD_NOTIFICATION_WEBHOOK_URL` empty. The frontend still shows WhatsApp click-to-chat CTAs, and form submissions will continue to save in Supabase with Telegram notification when Telegram is configured in the admin panel.

## Telegram Maintenance Reminders

The maintenance checklist in `docs/weekly-maintenance.md` is seeded into the `maintenance_reminder_items` table by migration `202605240009_maintenance_reminders.sql`.

The admin panel at `/admin/notifications` can:

- enable or disable Telegram lead alerts
- enable or disable website maintenance reminders
- set the preferred reminder day, time, and timezone
- send a Telegram test message
- send a maintenance reminder test message

The `maintenance-reminder` Edge Function builds a Telegram message with:

- new leads and quote requests
- leads or quote requests older than 24 hours
- weekly lead and quote counts
- published project, blog, material, and service area counts
- weekly website maintenance tasks
- optional monthly content tasks

For scheduled reminders, call the function weekly with:

```text
POST https://<project-ref>.functions.supabase.co/maintenance-reminder
Header: x-cron-secret: <MAINTENANCE_REMINDER_CRON_SECRET>
Body: { "include_monthly": false }
```

For the first week of each month, call the same function with:

```json
{ "include_monthly": true }
```

If you are not enabling scheduled maintenance reminders yet, you can leave `MAINTENANCE_REMINDER_CRON_SECRET` empty for now. The existing Telegram notifications for contact leads and quote requests will continue to work.

## Sitemap Routing

The repo generates a static `public/sitemap.xml` during build and deploys it with the site.

Keep `public/robots.txt` pointing to:

```text
Sitemap: https://flashcast.com.my/sitemap.xml
```
