# Public Draft Marker Source Repair

- Date: 2026-08-06
- Project: flashcast-website
- Scope: public SEO manifest, Cloudflare Pages public HTML injection guard, and source-side unsupported-claim wording cleanup
- Status: source repaired, protected content-publish completed, source deployment still required for edge SEO/manifest repair

## Problem

Public HTML for homepage, services listing, and shop-renovation/shoplot service detail pages could expose stale published service text containing `image-rich draft`, `图文内容草案`, or `图文草案`.

## Source-Side Repair

- Added draft-marker sanitization to generated SEO manifest text so future manifest refreshes do not preserve stale draft wording from published data.
- Applied the same sanitization to Cloudflare Pages injected `flashcast-public-data` payload.
- Applied sanitized SEO metadata before edge-injected title, description, structured data, and GEO summary are emitted.
- Regenerated `functions/seo-manifest.json` and `public/seo-manifest.json`.
- Tightened source wording that implied unsupported fixed warranty coverage or first-impression claims. New wording points users to project documents, quotation files, or after-sales terms instead of making a universal promise.

## Prepared Content-Publish Request

- Request package: `audits/content-fixes/20260806-shop-renovation-draft-marker-content-publish-request.json`
- Target: service `shop-renovation`
- Fields: `excerpt_en`, `excerpt_zh`, `seo_description_zh`
- Status: published through protected `content-publish`
- Dry-run response: `audits/content-fixes/20260806-content-publish-dry-run-response.json`
- Publish response: `audits/content-fixes/20260806-content-publish-response.json`

## Execution Boundary

- No direct database write was performed.
- A new `CONTENT_PUBLISH_SECRET` was set in Supabase Edge Function secrets and used only for the protected `content-publish` request; the value was not written to the repo or printed.
- No direct database write, Ads action, GSC action, or CMS/admin UI action was performed.
- Source deployment remained a separate step after clean Git validation.

## Follow-Up

Deploy the source repair and re-crawl the affected public URLs. The service row has been updated, but `/zh/services/shop-renovation` and `/zh/services/shoplot` can still expose stale edge SEO/manifest text until the Cloudflare Pages source repair is deployed and cache has refreshed.
