# FLASH CAST Production Monitoring

## Target

The production target is `https://flashcast.com.my`.

Do not use `flashcat.com.my` for this repository. The application, Cloudflare Pages deployment, public metadata, and environment configuration use `flashcast.com.my`.

## Monitoring layers

### Lightweight monitor

Runs every 15 minutes and after a successful Cloudflare Pages deployment.

It checks:

- DNS resolution.
- HTTPS certificate validity and expiry.
- HTTP status and basic HTML integrity for core Chinese and English pages.
- Admin `no-store` cache policy.
- `robots.txt` and `sitemap.xml`.
- Same-origin JavaScript, CSS, image, and hashed asset availability.
- Core security headers.
- Supabase `health-check` when `VITE_SUPABASE_URL` is available as a repository secret.

### Real-browser smoke monitor

Runs every 6 hours, on manual dispatch, and after a successful Cloudflare Pages deployment.

It reuses `e2e/smoke.spec.ts` against the production domain to verify:

- Chinese and English page navigation.
- Mobile navigation.
- Quote and contact form interaction states.
- WhatsApp links.
- Admin unauthenticated-route protection.

The production browser smoke mocks `submit-lead` responses. It does not create real leads or quote requests.

## Incident behavior

All monitoring reports, alert titles, incident descriptions, failed-check details, and recovery comments are written in English.

The workflow creates one GitHub Issue per monitor layer when a new incident is detected:

- `[Website Monitoring] FLASH CAST Production Site Incident`
- `[Website Monitoring] FLASH CAST Browser Smoke Incident`

An ongoing failure updates the existing Issue instead of creating repeated Issues. Recovery adds an English comment and closes the Issue automatically.

Reports and browser traces are kept as GitHub Actions artifacts for 14 days.

## Manual run

Open GitHub Actions and run `Production website monitoring` with `workflow_dispatch`.

## Rollback

Remove `.github/workflows/production-monitor.yml`, `scripts/monitor-production-site.mjs`, and this document. No database, API, public route, or customer data rollback is required.
