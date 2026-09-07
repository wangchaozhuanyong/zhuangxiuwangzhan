# FLASH CAST Website

FLASH CAST website is a company website with a Supabase-backed admin panel, public content pages, lead capture, media management, SEO tooling, and a reusable CMS foundation.

## Local Development

1. Install dependencies:

```bash
npm.cmd install
```

2. Copy environment variables:

```bash
copy .env.example .env
```

3. Fill in local Supabase values in `.env`.

4. Start the dev server:

```bash
npm.cmd run dev
```

## Environment Variables

Required for Supabase-backed admin features:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Public website defaults:

- `VITE_SITE_URL`
- `VITE_SITE_EMAIL`
- `VITE_SITE_PHONE_DISPLAY`
- `VITE_SITE_PHONE_E164`
- `VITE_SITE_WHATSAPP_NUMBER`
- `VITE_SITE_ADDRESS`

Supabase Edge Function secrets must be configured in Supabase, not committed to the repo:

- `SUPABASE_SERVICE_ROLE_KEY`
- `SITE_URL`
- `MAINTENANCE_REMINDER_CRON_SECRET`
- `CONTENT_PUBLISH_SECRET`
- Optional `CLOUDFLARE_API_TOKEN` with `Cache Purge` permission and `CLOUDFLARE_ZONE_ID` for best-effort edge purging. CMS publish invalidates HTML primarily by advancing the existing `site_settings.updated_at` content revision.

Do not commit real passwords, tokens, service role keys, or production secrets.

## Admin Content Publish API

SEO/GEO automation and approved content imports must not write database tables directly. Use the protected Supabase Edge Function `content-publish`, which acts as the backend publishing API for admin-approved content.

The API supports `service`, `service_area`, `homepage`, `blog`, `material`, `project`, and restricted `site_page` records. Published CMS records are also the runtime source for public HTML metadata, JSON-LD, `/sitemap.xml`, and `/llms.txt`; after this edge architecture is deployed, normal content updates do not require a frontend deployment.

Current protected publishing contract:

- Endpoint: `<SUPABASE_URL>/functions/v1/content-publish`
- Method: `POST`
- Auth: `Authorization: Bearer <admin user access token>` for an admin session, or `x-cron-secret: <CONTENT_PUBLISH_SECRET>` for approved SEO/GEO automation.
- Allowed roles: `super_admin`, `content_editor`; the machine secret is treated as a content editor automation path.
- Supported content types: `service`, `service_area`, restricted `homepage`, `blog`, `material`, `project`, and restricted `site_page`
- Dry run mode validates and previews the cleaned admin payload without writing.
- Publish mode requires `ownerApproved: true` and `explicitExecution: true`.
- Sync behavior: writes through the backend admin publishing flow, records `admin_audit_logs`, and returns SEO/QA next steps.
- Cache behavior: successful publish requests advance the content revision and request a best-effort purge of the `flashcast-public-html` cache tag; purge warnings do not hide a completed database write.
- Blog publish behavior: validates the existing `blog_posts` schema, rejects unknown fields and slug conflicts, enforces bilingual publish fields, and checks `expectedUpdatedAt` before updates.

Example dry run body:

```json
{
  "contentType": "service",
  "mode": "dry-run",
  "nextStatus": "draft",
  "record": {
    "slug": "kitchen",
    "title_zh": "厨房装修与橱柜定制",
    "title_en": "Kitchen Renovation and Cabinet Planning",
    "content_zh": "<p>中文页面建议文案</p>",
    "content_en": "<p>English page copy</p>",
    "seo_title_zh": "厨房装修与橱柜定制 | FLASH CAST",
    "seo_title_en": "Kitchen Renovation Malaysia | FLASH CAST"
  }
}
```

Example approved publish body:

```json
{
  "contentType": "service",
  "mode": "publish",
  "nextStatus": "published",
  "ownerApproved": true,
  "explicitExecution": true,
  "approvalId": "owner-approved-YYYY-MM-DD",
  "record": {
    "slug": "kitchen",
    "title_zh": "厨房装修与橱柜定制",
    "title_en": "Kitchen Renovation and Cabinet Planning"
  }
}
```

After any approved publish, regenerate SEO artifacts and verify the matching public `/zh` and `/en` pages. Blog detail entries carry CMS SEO, cover image, dates, and `BlogPosting` metadata into the generated manifest and edge HTML.

## Database Migrations

All schema changes must be added under `supabase/migrations`.

Important migrations:

- `202605240005_admin_access_policies.sql`: admin access and RLS foundation.
- `202605290004_site_pages.sql`: page-level content table.
- `202605300001_professional_admin_foundation.sql`: generic CMS, roles, revisions, indexes, optimistic conflict foundation.
- `202605310004_admin_role_policy_hardening.sql`: role-specific database policies for content, leads, media, settings, and uploads.

Apply migrations in order in the Supabase project before using new admin features.

## Admin Panel

Main admin areas:

- Dashboard: operational summary.
- CMS Builder: generic page/module editor for reusable company websites.
- Page Content: legacy page-level content editor.
- Home/About editors: current FLASH CAST-specific editors.
- Business content: services, projects, materials, blog, landing pages.
- Customers: leads and quote requests.
- Media and SEO: media library and SEO audit.
- System: website settings, notifications, system health, logs, translation records, admin users.

Admin content saves should use the shared admin mutation helper where possible so saves include:

- conflict checks using `updated_at`,
- audit logging,
- cache invalidation,
- clear error messages,
- no form reset on failure.

High-risk admin buttons should use the shared permission helper so each role gets a clear disabled reason:

- content editors can save, publish, archive, restore, and reorder content;
- lead managers can update leads and quote follow-ups;
- only super admins can manage admin accounts and sensitive system settings.

## Safety Rules

- Public pages read published content only.
- Admin writes must be protected by Supabase RLS or Edge Function auth checks.
- Frontend button-level permission hints are UX only; database RLS remains the real protection.
- Default content may create missing records or fill blank fields, but must not overwrite manually saved content.
- Important delete actions should archive first instead of hard deleting.
- Media upload allows only JPG, PNG, or WebP and rejects files over 5 MB. GIF, SVG, and unknown MIME types are rejected.

## Backup And Recovery

Minimum backup scope:

- Supabase database.
- Supabase Storage bucket `site-images`.
- Environment configuration.

Backups must be private. A backup is only useful after recovery has been tested at least once.

Create and verify an app-level content/media backup:

```powershell
npm.cmd run backup:supabase
npm.cmd run verify:backup
npm.cmd run restore:backup:dry-run
```

On a machine with Docker, set `USE_SUPABASE_CLI_DUMP=1` to create SQL dump files too. Without a service role key, the REST backup covers public content and media. With `SUPABASE_SERVICE_ROLE_KEY`, it also covers protected admin/customer tables.

## Troubleshooting

- Admin says Supabase is not configured: check `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- CMS Builder says tables are missing: apply `202605300001_professional_admin_foundation.sql`.
- Save conflict: someone edited the same record first; refresh, compare, then save again.
- Upload rejected: check file type and size.
- Public page shows old content: confirm the item is `published`, then refresh admin/public query caches.
