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

Do not commit real passwords, tokens, service role keys, or production secrets.

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

## Checks Before Release

Run these before deployment:

```bash
npm.cmd run typecheck
npm.cmd run lint
npm.cmd test -- --run
npm.cmd run build
npm.cmd run verify:deploy-cache
npm.cmd run verify:admin-foundation
npm.cmd run verify:env
```

## Deployment And Rollback

Automatic production deployment:

- Pushes to `main` run the `Prelaunch verification` workflow first.
- When `Prelaunch verification` succeeds on `main`, the `Deploy to Cloudflare Pages` workflow publishes the same commit to Cloudflare Pages.
- `Prelaunch verification` only checks the release. It is not a production deployment by itself.
- Manual deployment is still available through the `Deploy to Cloudflare Pages` workflow if an operator needs to republish a known commit.
- The production deploy workflow restores retained hashed assets, builds the new app, merges previous assets into `dist/assets`, verifies cache consistency, then deploys. This keeps old SPA HTML from breaking if it still points at the previous hashed JS chunks.
- HTML responses must stay `no-store`; `/assets/*`, `/images/*`, and `/videos/*` stay `public, max-age=31536000, immutable`.

Before deployment:

- Confirm the target environment is not connected to the wrong database.
- Apply database migrations in a staging/test environment first.
- Run the release checks above.
- Record the deployment time, commit/version, migration list, and operator.

After deployment:

- Check `/`, `/zh/services`, `/zh/projects`, `/zh/quote`, `/zh/process`, and `/admin`.
- Confirm an admin save appears on the public page after refresh.
- Confirm media upload works with a small test image.
- Check `/admin/system-health` and confirm core checks are green.
- Confirm `https://<project-ref>.functions.supabase.co/health-check` returns `ok: true`.

Rollback:

- Revert the frontend deployment to the previous stable build.
- Do not manually edit production tables unless a written recovery step requires it.
- For content mistakes, prefer CMS revision restore or archived content recovery.
- For database failures, restore from Supabase backup or a verified SQL dump.

## Backup And Recovery

Minimum backup scope:

- Supabase database.
- Supabase Storage bucket `site-images`.
- Environment configuration.
- Deployment version record.

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
