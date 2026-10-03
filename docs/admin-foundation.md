# Professional Admin Foundation

This document explains the baseline rules for maintaining the admin panel safely.

## Content Flow

- Public pages should prefer the generic CMS tables when published CMS content exists.
- Legacy tables remain as fallback until every dynamic page is fully migrated.
- Static pages do not need to be forced into CMS unless the business requires it.
- Default content is only allowed to insert missing rows or fill blank fields.

## Roles

Supported admin roles:

- `super_admin`: can manage everything.
- `content_editor`: can manage website content and CMS modules.
- `lead_manager`: intended for leads and quote follow-up workflows.
- `viewer`: can inspect admin data but should not perform writes.

Database RLS must remain the real permission layer. Frontend button hiding is only a user-experience layer.

Button-level permission hints are implemented with the shared admin permission helper:

- Content buttons such as save, publish, archive, restore, and reorder require `super_admin` or `content_editor`.
- Lead follow-up buttons require `super_admin` or `lead_manager`.
- Admin account management buttons require `super_admin`.
- Disabled buttons should explain the missing role in plain language.

## Editing Rules

- Long forms must keep user input after save failure.
- Important saves should use optimistic conflict checks with `updated_at`.
- Important writes should create an `admin_audit_logs` row.
- Critical frontend/admin errors should create a `system_event_logs` row.
- Important deletes should archive first when the table supports `status`.
- Page/module edits should create CMS revisions automatically.
- Long editors should warn before refresh/close when there are unsaved changes.

## CMS Builder

The CMS Builder uses:

- `cms_pages` for route-level page metadata.
- `cms_sections` for page modules.
- `cms_section_templates` for allowed module templates.
- `cms_content_entries` for reusable content entries.
- `cms_revisions` for restore history.

Current module templates:

- `hero`
- `rich_text`
- `service_grid`
- `project_grid`
- `faq`
- `cta`
- `gallery`
- `team`
- `testimonials`

The CMS Builder should prefer visual field editors for common modules. Advanced JSON editing remains available only for unusual fields.

Module order must be editable through drag-and-drop and keyboard-friendly up/down buttons. Saving order changes should write audit logs, refresh admin data, and invalidate public content caches.

## Media Upload Rules

- Allowed types: JPG, PNG, WebP.
- Max size: 5 MB.
- SVG, GIF, and unknown MIME types are rejected for the public media library.
- Folder names are sanitized before upload.
- Public media should always have meaningful alt text.

## Backup Checks

Environment verification requires an explicit supported `APP_ENV` or `NODE_ENV`. It parses HTTP(S) URLs and compares exact origins, using the existing governed Supabase release workflow as the production database identity. Non-production environments must use a separate site and database; missing or ambiguous production identity fails the check. Command-line environment values take precedence over `.env`, including explicitly empty values.

Default development uses `.env` plus `.env.development.local`; the private production settings live in `.env.production.local`. `npm run dev` validates the development target before Vite starts. Production operations must select the production mode explicitly; see [environment and recovery runbook](./environment-recovery.md).

For a full encrypted production package, run:

```sh
npm run backup:supabase:full
npm run verify:backup -- backups/TIMESTAMP
npm run restore:backup:full -- backups/TIMESTAMP
```

The full restore command only accepts this project's dedicated empty local rehearsal container, verifies encryption before SQL, preserves the source ownership/ACLs, and checks schema, table fields and media readback. A resumed verification never replaces imported data. Account acceptance is separate; original password, original MFA and effective permissions must pass before recovery is complete.

Legacy content-only commands:

```powershell
npm.cmd run backup:supabase
npm.cmd run verify:backup
npm.cmd run restore:backup:dry-run
```

If `SUPABASE_SERVICE_ROLE_KEY` is not set, the legacy backup is a public content/media backup. Supplying it increases table-read coverage but does not add Auth or database structure. Use the full encrypted procedure for account, schema and media recovery.

`full_access` describes table-read access, not complete disaster recovery. REST packages contain the declared public-schema table data and downloaded media; they exclude Auth accounts/passwords/MFA and database schema. Public-schema SQL dumps also exclude Auth and media objects. Record these boundaries and backup age separately from package validation.

`restore:backup:dry-run` validates the package without importing data. It does not replace an isolated restore with readback, or verification of account access and database structure. The health page keeps expired, warning and incomplete records marked as requiring attention.

The health API retains legacy dry-run records and additionally reports `latest_restore_verified`. A passing result requires recent successful backup, package verification and actual isolated restore records for the same `backup_folder`, including schema, data, Auth, media, original password login, original MFA and permission acceptance. A recovery-link login alone leaves password acceptance pending. Local health changes require their own approved deployment before the online UI gains the new actual-restore card.

## Recovery

- For wrong content: use CMS revision restore.
- For deleted content: check archived rows first.
- For database damage: restore from Supabase backup.
- For app content damage: restore a verified backup package to staging first, then production.

REST restore writes require `RESTORE_CONFIRM=YES`, an explicitly supplied staging `SUPABASE_SERVICE_ROLE_KEY`, and `--target-url=https://YOUR-ISOLATED-STAGING.supabase.co`. The script refuses the original production project and does not silently inherit its credential from `.env`. It restores tables in manifest order and uploads all declared media objects. Use a clean isolated target with the matching schema; generated CMS seed records can conflict on unique paths. A table/media rehearsal does not prove Auth account recovery. Production recovery needs its own approved procedure and verified environment backup.

Before exact-count acceptance, account for database USER triggers: restoring CMS/admin rows through REST can create extra revision/audit records. In the isolated rehearsal only, pause those triggers during the import and re-enable them in a guaranteed cleanup step; keep foreign-key constraints active. Check restored counts, all original field values and media bytes after import. Do not disable production triggers or treat an HTTP success as an exact recovery result.
