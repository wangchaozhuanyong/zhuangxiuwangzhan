# 2026-08-14 Admin And Public Content Sync

## Scope

- Make published service content from the admin CMS the primary source on public service listings.
- Enforce the same published-service completeness rules in the admin service layer and the `content-publish` Edge Function.
- Replace automatic default-content writes with an explicit, confirmed admin action.
- Keep admin editor reads read-only so opening an editor cannot silently create content.
- No database migration, authentication, payment, project editor, or production configuration changes.

## Backup

- Supabase backup: `backups/2026-08-14T14-06-53-301Z`
- Coverage: 31 database tables and 39 storage files.
- Backup verification completed before deployment.

## Deployment

- Source branch: `codex/admin-client-sync-20260814`
- Git revision: the commit containing this record.
- Deploy `content-publish` before the Cloudflare Pages frontend.
- Operator: Codex, authorized by the repository owner.

## Verification

- TypeScript, ESLint, architecture, unit tests, production build, deploy-cache, and SEO HTML checks.
- Targeted tests cover both admin and Edge Function service publish validation.
- Production route and image audit covers 120 public routes.
- Post-deployment checks cover the public services list, service detail routes, and deployed Edge Function status.

## Rollback Plan

1. Roll back Cloudflare Pages to the previous successful production deployment.
2. Redeploy the previous `content-publish` Edge Function revision.
3. No database rollback is expected because this release contains no migration or direct content write.
4. If content restoration is required, use the verified backup through the approved admin/content-publish path.
