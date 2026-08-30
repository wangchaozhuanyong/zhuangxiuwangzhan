import type { QueryClient } from "@tanstack/react-query";
import type { AdminUserRow } from "@/lib/adminEditorData";
import {
  findAdminUserByUserId,
  saveAdminUserRecord,
} from "@/backend/modules/admin-users/repository/adminUserRepository";

export function getAdminUserForUpsert(userId: string) {
  return findAdminUserByUserId(userId);
}

export function saveAdminUser(
  payload: Partial<AdminUserRow> & { user_id: string },
  existing: AdminUserRow | null | undefined,
  queryClient?: QueryClient,
) {
  return saveAdminUserRecord(payload, existing, queryClient);
}

export function isProtectedAdminUserMutationError(error: unknown) {
  const message = error instanceof Error ? error.message : (error as { message?: unknown } | null)?.message;
  return typeof message === "string"
    && (
      message.includes("self_admin_role_change_forbidden")
      || message.includes("last_super_admin_required")
      || message.includes("admin_user_identity_change_forbidden")
    );
}
