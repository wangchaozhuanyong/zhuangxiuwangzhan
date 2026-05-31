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

## Release Checklist

Run before release:

```bash
npm.cmd run typecheck
npm.cmd run lint
npm.cmd test -- --run
npm.cmd run build
npm.cmd run verify:admin-foundation
npm.cmd run verify:env
npm.cmd run verify:backup
```

Manual checks:

- `/admin` loads.
- CMS Builder loads after migration.
- A simple page save succeeds.
- A repeated save does not create duplicate data.
- A stale edit shows a conflict message.
- A small image upload succeeds.
- A large or unsupported file is rejected.
- `/admin/system-logs` loads for admins.
- `/admin/system-health` shows the health check and backup reminders.
- The health check function returns `ok: true`.

## Backup Checks

Run:

```powershell
npm.cmd run backup:supabase
npm.cmd run verify:backup
npm.cmd run restore:backup:dry-run
```

If `SUPABASE_SERVICE_ROLE_KEY` is not set, the backup is a public content/media backup. For a full production backup, run the same script with `SUPABASE_SERVICE_ROLE_KEY` in a private environment, or run `USE_SUPABASE_CLI_DUMP=1` on a machine with Docker.

## Recovery

- For wrong content: use CMS revision restore.
- For deleted content: check archived rows first.
- For database damage: restore from Supabase backup.
- For app content damage: restore a verified backup package to staging first, then production.
- For bad deployment: roll back the frontend build before touching data.
