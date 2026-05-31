import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

const checks = [
  {
    file: "supabase/migrations/202605300001_professional_admin_foundation.sql",
    patterns: [
      "create table if not exists public.cms_pages",
      "create table if not exists public.cms_sections",
      "create table if not exists public.cms_content_entries",
      "create table if not exists public.cms_revisions",
      "create or replace function public.has_admin_role",
      "create or replace function public.record_cms_revision",
      "cms_pages_status_sort_idx",
      "services_status_sort_updated_idx",
    ],
  },
  {
    file: "supabase/migrations/202605300002_security_ops_hardening.sql",
    patterns: ["system_event_logs", "storage.buckets", "file_size_limit = 5242880"],
  },
  {
    file: "supabase/migrations/202605310004_admin_role_policy_hardening.sql",
    patterns: ["Content roles can write services", "Lead roles can write leads", "Content roles can upload site images"],
  },
  {
    file: "src/lib/adminMutation.ts",
    patterns: ["saveAdminRecord", "archiveOrDeleteAdminRecord", "AdminMutationError", "admin_audit_logs", "expectedUpdatedAt"],
  },
  {
    file: "src/lib/systemLog.ts",
    patterns: ["logSystemEvent", "system_event_logs"],
  },
  {
    file: "src/hooks/useUnsavedChangesWarning.ts",
    patterns: ["DEFAULT_MESSAGE", "beforeunload"],
  },
  {
    file: "src/pages/admin/AdminCmsBuilder.tsx",
    patterns: ["cms_pages", "cms_sections", "cms_revisions", "restoreRevision", "SectionContentEditor", "service_grid", "testimonials", "draggable", "section_reorder"],
  },
  {
    file: "src/components/admin/AdminPermission.tsx",
    patterns: ["AdminActionButton", "useAdminPermission", "content.publish", "lead.write", "users.manage"],
  },
  {
    file: "src/pages/admin/AdminSystemHealth.tsx",
    patterns: ["health-check", "备份和恢复状态", "system_event_logs"],
  },
  {
    file: "src/pages/admin/AdminSystemLogs.tsx",
    patterns: ["system_event_logs", "最近 100 条"],
  },
  {
    file: "src/pages/admin/AdminImageUpload.tsx",
    patterns: ["MAX_UPLOAD_BYTES", "ALLOWED_IMAGE_TYPES", "sanitizeFolder"],
  },
  {
    file: "scripts/backup-supabase.mjs",
    patterns: ["backupViaRest", "site-images", "manifest.json"],
  },
  {
    file: "scripts/restore-supabase-backup.mjs",
    patterns: ["RESTORE_CONFIRM", "--dry-run"],
  },
  {
    file: "README.md",
    patterns: ["Checks Before Release", "Deployment And Rollback", "Backup And Recovery", "restore:backup:dry-run"],
  },
  {
    file: "docs/admin-foundation.md",
    patterns: ["Professional Admin Foundation", "Release Checklist", "Recovery", "Backup Checks"],
  },
];

const failures = [];

for (const check of checks) {
  const fullPath = path.join(root, check.file);
  if (!fs.existsSync(fullPath)) {
    failures.push(`${check.file} is missing`);
    continue;
  }
  const content = read(check.file);
  for (const pattern of check.patterns) {
    if (!content.includes(pattern)) failures.push(`${check.file} missing: ${pattern}`);
  }
}

if (failures.length) {
  console.error("[verify-admin-foundation] failures:");
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log("[verify-admin-foundation] OK");
