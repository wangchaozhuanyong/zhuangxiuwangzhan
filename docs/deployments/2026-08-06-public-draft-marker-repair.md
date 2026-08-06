# 2026-08-06 Public Draft Marker Repair

## Scope

- Public website source repair for stale FLASH CAST draft-marker wording.
- CMS record repair for `services.slug=shop-renovation`.
- No Google Ads changes.
- No direct database table write; CMS content was updated through the protected `content-publish` path.

## Backup

- Fresh Supabase REST JSON backup: `backups/2026-08-06T18-33-28-098Z`
- Backup verification: `npm run verify:backup -- backups/2026-08-06T18-33-28-098Z`
- Restore dry-run: `npm run restore:backup:dry-run -- backups/2026-08-06T18-33-28-098Z`

## Change Summary

- Edge middleware now sanitizes public injected content, SEO metadata, schema, and GEO summary text for stale draft markers and unsupported wording.
- SEO manifest generation applies the same sanitization before writing generated route metadata.
- Source content seeds and public i18n wording now avoid unconfirmed warranty and first-impression claims.
- `services.slug=shop-renovation` CMS record was updated to remove stale draft-marker wording.

## Rollback Plan

1. If Cloudflare Pages deployment causes public routing, asset, or SEO metadata regressions, roll back to the previous successful Cloudflare Pages deployment.
2. If CMS content regression is detected for `shop-renovation`, restore that service record from `backups/2026-08-06T18-33-28-098Z/tables/services.json` through the approved admin/content-publish path.
3. Do not direct-write database rows during rollback.
4. After rollback, verify `/en`, `/zh`, `/en/services`, `/zh/services`, `/en/services/shop-renovation`, `/zh/services/shop-renovation`, and `/zh/services/shoplot`.

## Verification Commands

- `npm run release:check`
- `npm run verify:preview:server`
- `npm run verify:seo-html`
- `npm run verify:admin-foundation`
- `npm run ui:text-check`
- `git diff --check`
- Targeted live draft-marker fetch after deployment.
- Managed growth content integrity audit after deployment.
