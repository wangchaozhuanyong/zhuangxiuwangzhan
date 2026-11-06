import fs from "node:fs";
import path from "node:path";
import { verifyAdminMutationContracts } from "./lib/admin-foundation-contracts.mjs";

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
    file: "supabase/migrations/20260830085643_admin_role_safety.sql",
    patterns: ["is_admin_identity", "self_admin_role_change_forbidden", "last_super_admin_required", "protect_last_super_admin"],
  },
  {
    file: "supabase/migrations/20260830085644_admin_mfa_enforcement.sql",
    patterns: ["auth.jwt() ->> 'aal'", "'aal2'", "public.admin_role", "public.has_admin_role"],
  },
  {
    file: "supabase/migrations/20260830085645_admin_identity_immutability.sql",
    patterns: ["admin_user_identity_change_forbidden", "before update of user_id, role, active or delete"],
  },
  {
    file: "supabase/migrations/20261105174151_trusted_audit_writes.sql",
    patterns: [
      "trusted_backup_evidence boolean not null default false",
      "revoke insert on public.admin_audit_logs, public.cms_revisions from public, anon, authenticated",
      'drop policy if exists "Admins can create audit logs" on public.admin_audit_logs',
      'drop policy if exists "System can create cms revisions" on public.cms_revisions',
      "create function private.audit_admin_record_change()",
      "security definer\nset search_path = ''",
      "actor uuid := auth.uid()",
      "if actor is null or not public.is_admin() then",
      "insert into public.admin_audit_logs(admin_user_id, action, table_name, record_id, old_value, new_value)",
      "values (actor, row_action, tg_table_name, row_id, before_row, after_row)",
      "after insert or update or delete on public.%I",
      "revoke all on function private.audit_admin_record_change() from public, anon, authenticated",
      "actor_id = (select auth.uid())",
      "and not trusted_backup_evidence",
    ],
  },
  {
    file: "supabase/tests/trusted_audit_writes.sql",
    patterns: [
      "browser audit forgery accepted",
      "browser CMS revision forgery accepted",
      "browser backup evidence forgery accepted",
      "browser diagnostic actor forgery accepted",
      "actual admin edit did not create an actor-bound audit",
      "legacy and trusted server evidence were not distinguished",
    ],
  },
  {
    file: "src/lib/adminMutation.ts",
    patterns: ["saveAdminRecord", "archiveOrDeleteAdminRecord", "AdminMutationError"],
  },
  {
    file: "src/backend/modules/system/service/adminMutationService.ts",
    patterns: ["persistAdminRecord", "persistAdminRecordRemoval", "expectedUpdatedAt"],
    forbidden: [/\binsertAdminAuditLog\b/u],
  },
  {
    file: "src/backend/modules/system/repository/adminMutationRepository.ts",
    patterns: ["fetchAdminMutationRecord", "archiveAdminMutationRecord"],
    forbidden: [/\binsertAdminAuditLog\b|\.from\s*\(\s*["'](?:admin_audit_logs|cms_revisions)["']\s*\)/u],
  },
  {
    file: "src/lib/systemLog.ts",
    patterns: ["logSystemEvent"],
  },
  {
    file: "src/backend/modules/system/repository/systemEventRepository.ts",
    patterns: ["system_event_logs", "fetchSystemEventLogs", "insertSystemEventLog"],
  },
  {
    file: "src/hooks/useUnsavedChangesWarning.ts",
    patterns: ["DEFAULT_MESSAGE", "beforeunload"],
  },
  {
    file: "src/pages/admin/AdminCmsBuilder.tsx",
    patterns: ["cms_pages", "cms_sections", "cms_revisions", "restoreRevision", "SectionContentEditor", "draggable", "section_reorder"],
  },
  {
    file: "src/i18n/adminCmsBuilderText.ts",
    patterns: ["service_grid", "testimonials"],
  },
  {
    file: "src/components/admin/AdminPermission.tsx",
    patterns: ["AdminActionButton", "useAdminPermission", "content.publish", "lead.write", "users.manage"],
  },
  {
    file: "src/backend/modules/admin-auth/service/adminAuthService.ts",
    patterns: ["prepareAdminMfaFlow", "verifyAdminMfa", "getAdminMfaState"],
  },
  {
    file: "src/pages/admin/AdminLogin.tsx",
    patterns: ["showPassword", "mfaEnrollment", "verifyAdminMfa", "one-time-code"],
  },
  {
    file: "src/pages/admin/AdminSystemHealth.tsx",
    patterns: ["adminSystemHealthText", "fetchAdminSystemHealth"],
  },
  {
    file: "src/backend/modules/system/repository/systemHealthRepository.ts",
    patterns: ["health-check", "form-attempts-maintenance"],
  },
  {
    file: "src/i18n/adminSystemHealthText.ts",
    patterns: ["backupSectionTitle", "system_event_logs"],
  },
  {
    file: "src/pages/admin/AdminSystemLogs.tsx",
    patterns: ["system_event_logs", "adminSystemLogsText"],
  },
  {
    file: "src/i18n/adminSystemLogsText.ts",
    patterns: ["latest 100 rows"],
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
    file: "scripts/lib/system-health-events.mjs",
    patterns: ["logSystemHealthEvent", 'source: "ops"'],
    forbidden: [/\btrusted_backup_evidence\s*:/u],
  },
  {
    file: "scripts/record-recovery-status.mjs",
    patterns: ["verifyFullPackage(folder, root, options)", "receipt_fingerprint", "trusted_backup_evidence: true"],
  },
  {
    file: "supabase/functions/health-check/repository.ts",
    patterns: ['.eq("trusted_backup_evidence", true)'],
  },
  {
    file: "scripts/restore-supabase-backup.mjs",
    patterns: ["RESTORE_CONFIRM", "--dry-run"],
  },
  {
    file: "README.md",
    patterns: ["Backup And Recovery", "restore:backup:dry-run"],
  },
  {
    file: "docs/admin-foundation.md",
    patterns: ["Professional Admin Foundation", "Recovery", "Backup Checks"],
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
  for (const pattern of check.forbidden ?? []) {
    if (pattern.test(content)) failures.push(`${check.file} contains forbidden pattern: ${pattern}`);
  }
}

const mutationContractFiles = [
  "src/lib/adminMutation.ts",
  "src/backend/modules/system/service/adminMutationService.ts",
  "src/backend/modules/system/index.ts",
];
failures.push(...verifyAdminMutationContracts(new Map(mutationContractFiles
  .filter((file) => fs.existsSync(path.join(root, file)))
  .map((file) => [file, read(file)]))));

if (failures.length) {
  console.error("[verify-admin-foundation] failures:");
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log("[verify-admin-foundation] OK");
