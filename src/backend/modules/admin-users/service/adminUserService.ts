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
